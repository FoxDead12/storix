use brook_http_worker::worker::job::JobAbstract;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

pub struct Delete;

#[derive(Deserialize, Debug)]
struct SessionPayload {
    schema: String,
}

#[derive(Deserialize, Debug)]
struct ParamsPayload {
    uuid: String,
}

#[derive(Serialize)]
struct FileRecord {
    uuid: String,
    #[serde(rename = "type")]
    file_type: String,
    extension: Option<String>,
    description: String,
}

impl JobAbstract for Delete {

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
                    return self.error_response(&mut job, "Need indicate the uuid of file", Some("PARAMS_MISMATCH"), None, None);
                }
            },
            None => return self.error_response(&mut job, "Need indicate the uuid of file", Some("MISSING_PARAMS"), None, None)
        };

        let upload_dir = match std::env::var("STORIX_UPLOAD_DIR") {
            Ok(v) => v,
            Err(_) => {
                brook_http_worker::logger::log("ERROR", "Missing STORIX_UPLOAD_DIR env var");
                return self.exception_response(&mut job, "Internal server error", Some("MISSING_CONFIG"), None, None);
            }
        };

        // ... validate the file exists and belongs to this tenant before touching disk ...
        let select_query = format!("SELECT uuid, type, extension, description FROM {}.files WHERE uuid = $1", session.schema);
        let record = match job.postgres.query_opt(&select_query, &[&params.uuid]) {
            Ok(Some(row)) => row,
            Ok(None) => return self.error_response(&mut job, "The file indicated don't exist", Some("NOT_FOUND"), None, None),
            Err(e) => {
                brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                return self.exception_response(&mut job, "Internal server error", Some("DATABASE_ERROR"), None, None);
            }
        };

        let file_type: String = record.get("type");

        let delete_query = format!("DELETE FROM {}.files WHERE uuid = $1", session.schema);
        if let Err(e) = job.postgres.execute(&delete_query, &[&params.uuid]) {
            brook_http_worker::logger::log("ERROR", e.to_string().as_str());
            return self.exception_response(&mut job, "Internal server error", Some("DATABASE_ERROR"), None, None);
        }

        // ... best effort disk cleanup, the database record is already gone at this point ...
        let file_absolute = Path::new(&upload_dir).join(&session.schema).join(&params.uuid);
        if let Err(e) = fs::remove_file(&file_absolute) {
            brook_http_worker::logger::log("ERROR", format!("delete: failed to remove {}: {}", file_absolute.display(), e).as_str());
        }

        if file_type == "image" || file_type == "video" {
            let thumbnail_absolute = Path::new(&upload_dir).join(&session.schema).join("templates").join(&params.uuid);
            if let Err(e) = fs::remove_file(&thumbnail_absolute) {
                brook_http_worker::logger::log("ERROR", format!("delete: failed to remove thumbnail {}: {}", thumbnail_absolute.display(), e).as_str());
            }
        }

        let response = FileRecord {
            uuid: record.get("uuid"),
            file_type,
            extension: record.get("extension"),
            description: record.get("description"),
        };

        self.success_response(&mut job, "File successfully deleted", None, Some(serde_json::json!(response)), None);
    }

}
