use brook_http_worker::worker::job::JobAbstract;
use serde::Deserialize;
use serde_json::json;
use std::fs;
use std::path::Path;
use zip::write::FileOptions;

use crate::files::upload::generate_uuid_v4;

pub struct DownloadZip;

const MAX_ITEMS: usize = 20;
// ... kept out of STORIX_UPLOAD_DIR on purpose: these are throwaway files, unrelated to user
// storage, and easier to prune in bulk from a fixed, well-known path (see cleanup_download_zips.sh) ...
const DOWNLOAD_ZIPS_ROOT: &str = "/tmp/download_zips";

#[derive(Deserialize, Debug)]
struct SessionPayload {
    schema: String,
}

#[derive(Deserialize, Debug)]
struct ParamsPayload {
    items: String,
}

impl JobAbstract for DownloadZip {

    fn perform(&self, mut job: brook_http_worker::worker::job::Job) {

        let session: SessionPayload = match &job.session {
            Some(raw) => match serde_json::from_value::<SessionPayload>(raw.clone()) {
                Ok(p) => p,
                Err(e) => {
                    brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                    return self.exception_response(&mut job, "Internal server error", Some("PAYLOAD_MISMATCH"), None, None);
                }
            },
            None => return self.exception_response(&mut job, "Internal server error", Some("MISSING_PAYLOAD"), None, None)
        };

        let params: ParamsPayload = match &job.params {
            Some(raw) => match serde_json::from_value::<ParamsPayload>(raw.clone()) {
                Ok(p) => p,
                Err(e) => {
                    brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                    return self.error_response(&mut job, "Need indicate at least 1 item to download", Some("PARAMS_MISMATCH"), None, None);
                }
            },
            None => return self.error_response(&mut job, "Need indicate at least 1 item to download", Some("MISSING_PARAMS"), None, None)
        };

        // ... brook doesn't url-decode query params (it just memcpy's the raw bytes), so a
        // comma-separated list encoded by the browser as "uuid1%2Cuuid2" arrives here with
        // the literal "%2C" still in it instead of a real comma ...
        let decoded_items = percent_decode(&params.items);
        let uuids: Vec<String> = decoded_items.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect();

        if uuids.is_empty() {
            return self.error_response(&mut job, "Need indicate at least 1 item to download", Some("EMPTY_ITEMS"), None, None);
        }

        // ... safe check to dont create a big .zip file, mirrors the previous node implementation ...
        if uuids.len() > MAX_ITEMS {
            return self.error_response(&mut job, "The max files to download at same time is 20", Some("TOO_MANY_ITEMS"), None, None);
        }

        let upload_dir = match std::env::var("STORIX_UPLOAD_DIR") {
            Ok(v) => v,
            Err(_) => {
                brook_http_worker::logger::log("ERROR", "Missing STORIX_UPLOAD_DIR env var");
                return self.exception_response(&mut job, "Internal server error", Some("MISSING_CONFIG"), None, None);
            }
        };

        // ... path is stored relative to upload_dir as "{schema}/{uuid}", already scoped to this
        // tenant since it's read from the tenant's own {schema}.files table ...
        let query = format!("SELECT path, description FROM {}.files WHERE uuid = ANY($1)", session.schema);
        let rows = match job.postgres.query(&query, &[&uuids]) {
            Ok(rows) => rows,
            Err(e) => {
                brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                return self.exception_response(&mut job, "Internal server error", Some("DATABASE_ERROR"), None, None);
            }
        };

        if rows.is_empty() {
            return self.error_response(&mut job, "None of the indicated files exist", Some("NOT_FOUND"), None, None);
        }

        // ... bucketed by day/hour so an external cron can prune whole buckets once their hour
        // has passed, instead of tracking individual file lifetimes (see jobs/scripts/cleanup_download_zips.sh) ...
        let now = chrono::Utc::now();
        let day = now.format("%Y-%m-%d").to_string();
        let hour = now.format("%H").to_string();
        let tmp_dir = Path::new(DOWNLOAD_ZIPS_ROOT).join(&day).join(&hour);
        if let Err(e) = fs::create_dir_all(&tmp_dir) {
            brook_http_worker::logger::log("ERROR", e.to_string().as_str());
            return self.exception_response(&mut job, "Internal server error", Some("FS_ERROR"), None, None);
        }

        let zip_name = format!("{}.zip", generate_uuid_v4());
        let zip_relative = format!("{}/{}/{}", day, hour, zip_name);
        let zip_absolute = tmp_dir.join(&zip_name);

        let zip_file = match fs::File::create(&zip_absolute) {
            Ok(f) => f,
            Err(e) => {
                brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                return self.exception_response(&mut job, "Internal server error", Some("FS_ERROR"), None, None);
            }
        };

        let mut writer = zip::ZipWriter::new(zip_file);
        // ... stored (no compression), matches the previous node implementation which used
        // archiver with zlib level 0: photos/videos are already compressed formats ...
        let options = FileOptions::default().compression_method(zip::CompressionMethod::Stored);

        for row in &rows {
            let relative_path: String = row.get("path");
            let description: String = row.get("description");
            let absolute_path = Path::new(&upload_dir).join(&relative_path);

            let mut source = match fs::File::open(&absolute_path) {
                Ok(f) => f,
                Err(e) => {
                    brook_http_worker::logger::log("ERROR", format!("download-zip: skipping missing file {}: {}", absolute_path.display(), e).as_str());
                    continue;
                }
            };

            if let Err(e) = writer.start_file(&description, options) {
                brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                continue;
            }

            if let Err(e) = std::io::copy(&mut source, &mut writer) {
                brook_http_worker::logger::log("ERROR", format!("download-zip: failed to copy {}: {}", absolute_path.display(), e).as_str());
            }
        }

        if let Err(e) = writer.finish() {
            brook_http_worker::logger::log("ERROR", e.to_string().as_str());
            return self.exception_response(&mut job, "Internal server error", Some("ZIP_ERROR"), None, None);
        }

        brook_http_worker::logger::log("INFO", format!("download-zip: redirecting to nginx internal path /internal/download-zips/{}", zip_relative).as_str());

        // ... cleanup is external: a cron job (jobs/scripts/cleanup_download_zips.sh) prunes
        // whole day/hour buckets under DOWNLOAD_ZIPS_ROOT once their hour has passed, so nothing
        // needs to delete this file here ...
        let headers = json!({
            "X-Accel-Redirect": format!("/internal/download-zips/{}", zip_relative),
            "Content-Type": "application/zip",
            "Content-Disposition": "attachment; filename=\"download.zip\""
        });

        self.success_response(&mut job, "", None, None, Some(headers));
    }

}

// ... brook forwards query param values raw, with no url-decoding at all, so any percent-encoded
// byte (e.g. "%2C" for a literal comma) has to be decoded here before the value can be used ...
fn percent_decode(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(byte) = u8::from_str_radix(&input[i + 1..i + 3], 16) {
                out.push(byte);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}
