use brook_http_worker::worker::job::JobAbstract;
use serde::Deserialize;
use serde_json::json;

pub struct Download;

#[derive(Deserialize, Debug)]
struct SessionPayload {
  schema: String,
}

#[derive(Deserialize, Debug)]
struct ParamsPayload {
  uuid: String,
  #[serde(rename = "filter[thumbnail]")]
  thumbnail: Option<String>,
}

impl JobAbstract for Download {

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

    let is_thumbnail = params.thumbnail.as_deref() == Some("true");

    let query = format!("SELECT path, extension FROM {}.files WHERE uuid = $1", session.schema);

    let row = match job.postgres.query_opt(&query, &[&params.uuid]) {
      Ok(Some(row)) => row,
      Ok(None) => return self.error_response(&mut job, "File don't exist", Some("NOT_FOUND"), None, None),
      Err(e) => {
        brook_http_worker::logger::log("ERROR", e.to_string().as_str());
        return self.exception_response(&mut job, "Internal server error", Some("DATABASE_ERROR"), None, None);
      }
    };

    let file_relative: String = row.get("path");
    let extension: Option<String> = row.get("extension");

    // ... thumbnails are always generated as jpeg by the upload job, regardless of the original type ...
    let (target_relative, content_type) = if is_thumbnail {
      (format!("{}/templates/{}", session.schema, params.uuid), "image/jpeg".to_string())
    } else {
      (file_relative, mime_from_extension(extension.as_deref()))
    };

    brook_http_worker::logger::log("INFO", format!("download: redirecting {} to nginx internal path /internal/uploads/{}", params.uuid, target_relative).as_str());

    let headers = json!({
      "X-Accel-Redirect": format!("/internal/uploads/{}", target_relative),
      "Content-Type": content_type
    });

    self.success_response(&mut job, "", None, None, Some(headers));
  }

}

fn mime_from_extension(extension: Option<&str>) -> String {
  match extension {
    Some("jpg") | Some("jpeg") => "image/jpeg",
    Some("png") => "image/png",
    Some("webp") => "image/webp",
    Some("gif") => "image/gif",
    Some("avif") => "image/avif",
    Some("mp4") => "video/mp4",
    Some("mov") => "video/quicktime",
    Some("webm") => "video/webm",
    Some("mkv") => "video/x-matroska",
    Some("avi") => "video/x-msvideo",
    Some("pdf") => "application/pdf",
    _ => "application/octet-stream",
  }.to_string()
}
