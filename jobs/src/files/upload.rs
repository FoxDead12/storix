use brook_http_worker::worker::job::JobAbstract;
use chrono::{DateTime, NaiveDateTime};
use image::{imageops, DynamicImage};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

pub struct Upload;

// ... single static size used for every thumbnail (photo or video), keeps the grid consistent ...
const THUMBNAIL_MAX_SIZE: u32 = 200;
const THUMBNAIL_QUALITY: u8 = 75;

#[derive(Deserialize, Debug)]
struct SessionPayload {
  schema: String,
}

#[derive(Deserialize, Debug)]
struct ParamsPayload {
  file_name: String,
  directory: Option<String>,
}

#[derive(Serialize)]
struct FileRecord {
  uuid: String,
  extension: Option<String>,
  size: i64,
  birthtime: String,
  path: String,
  description: String,
}

impl JobAbstract for Upload {

  fn perform(&self, mut job: brook_http_worker::worker::job::Job) {

    // ... check if session json is valid ...
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

    // ... check if params json is valid ...
    let params: ParamsPayload = match &job.params {
      Some(raw) => match serde_json::from_value::<ParamsPayload>(raw.clone()) {
        Ok(p) => p,
        Err(e) => {
          brook_http_worker::logger::log("ERROR", e.to_string().as_str());
          return self.error_response(&mut job, "Invalid parameters structure", Some("PARAMS_MISMATCH"), None, None);
        }
      },
      None => return self.error_response(&mut job, "Is necessary indicate the file name", Some("MISSING_PARAMS"), None, None)
    };

    let directory_id: i32 = params.directory.as_deref().and_then(|d| d.parse::<i32>().ok()).unwrap_or(0);

    // ... nginx leaves the uploaded body in a temp file and brook forwards its path ...
    let temp_path = match &job.file_path {
      Some(p) if !p.is_empty() => PathBuf::from(p),
      _ => return self.error_response(&mut job, "No file was received", Some("MISSING_FILE"), None, None)
    };

    brook_http_worker::logger::log("INFO", format!("upload: received temp file at {}", temp_path.display()).as_str());

    let upload_dir = match std::env::var("STORIX_UPLOAD_DIR") {
      Ok(v) => v,
      Err(_) => {
        brook_http_worker::logger::log("ERROR", "Missing STORIX_UPLOAD_DIR env var");
        return self.exception_response(&mut job, "Internal server error", Some("MISSING_CONFIG"), None, None);
      }
    };

    // ... generate uuid (internal name of file) and path to file ...
    let uuid = generate_uuid_v4();
    let file_relative = format!("{}/{}", session.schema, uuid);
    let file_absolute = Path::new(&upload_dir).join(&session.schema).join(&uuid);
    let thumbnail_absolute = Path::new(&upload_dir).join(&session.schema).join("templates").join(&uuid);

    brook_http_worker::logger::log("INFO", format!("upload: will store file at {}", file_absolute.display()).as_str());

    if let Some(parent) = file_absolute.parent() {
      if let Err(e) = fs::create_dir_all(parent) {
        brook_http_worker::logger::log("ERROR", e.to_string().as_str());
        return self.exception_response(&mut job, "Internal server error", Some("FS_ERROR"), None, None);
      }
    }

    // ... move file from the nginx temp location to its permanent path ...
    if let Err(e) = move_file(&temp_path, &file_absolute) {
      brook_http_worker::logger::log("ERROR", format!("upload: failed to move {} to {}: {}", temp_path.display(), file_absolute.display(), e).as_str());
      return self.error_response(&mut job, "Error uploading the file", Some("MOVE_FAILED"), None, None);
    }

    brook_http_worker::logger::log("INFO", format!("upload: file saved at {}", file_absolute.display()).as_str());

    // ... get file stats ...
    let file_stats = match fs::metadata(&file_absolute) {
      Ok(m) => m,
      Err(e) => {
        brook_http_worker::logger::log("ERROR", e.to_string().as_str());
        let _ = fs::remove_file(&file_absolute);
        return self.exception_response(&mut job, "Internal server error", Some("FS_ERROR"), None, None);
      }
    };

    let mut birthtime: NaiveDateTime = file_stats.created()
      .or_else(|_| file_stats.modified())
      .map(|t| DateTime::<chrono::Utc>::from(t).naive_utc())
      .unwrap_or_else(|_| chrono::Utc::now().naive_utc());

    // ... get real type of file from its magic bytes ...
    let mime = match infer::get_from_path(&file_absolute) {
      Ok(Some(mime)) => mime,
      _ => {
        let _ = fs::remove_file(&file_absolute);
        return self.error_response(&mut job, "Invalid mime type detect", Some("INVALID_MIME"), None, None);
      }
    };

    let file_type: &str;

    match mime.matcher_type() {

      infer::MatcherType::Image => {

        const ALLOWED_IMAGE_MIME: [&str; 5] = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
        if !ALLOWED_IMAGE_MIME.contains(&mime.mime_type()) {
          let _ = fs::remove_file(&file_absolute);
          return self.error_response(&mut job, "Invalid image type received", Some("INVALID_IMAGE_TYPE"), None, None);
        }

        file_type = "image";

        // ... best effort read of exif metadata (orientation + capture date) ...
        if let Some(exif) = read_exif(&file_absolute) {
          if let Some(date) = exif_datetime(&exif) {
            birthtime = date;
          }
        }

        if let Err(e) = generate_image_thumbnail(&file_absolute, &thumbnail_absolute) {
          brook_http_worker::logger::log("ERROR", format!("upload: failed to generate image thumbnail at {}: {}", thumbnail_absolute.display(), e).as_str());
          let _ = fs::remove_file(&file_absolute);
          return self.exception_response(&mut job, "Error processing the image", Some("THUMBNAIL_FAILED"), None, None);
        }

        brook_http_worker::logger::log("INFO", format!("upload: image thumbnail saved at {}", thumbnail_absolute.display()).as_str());
      }

      infer::MatcherType::Video => {

        file_type = "video";

        // ... best effort read of video creation date ...
        if let Some(date) = video_creation_time(&file_absolute) {
          birthtime = date;
        }

        if let Err(e) = generate_video_thumbnail(&file_absolute, &thumbnail_absolute) {
          brook_http_worker::logger::log("ERROR", format!("upload: failed to generate video thumbnail at {}: {}", thumbnail_absolute.display(), e).as_str());
          let _ = fs::remove_file(&file_absolute);
          return self.exception_response(&mut job, "Error processing the video", Some("THUMBNAIL_FAILED"), None, None);
        }

        brook_http_worker::logger::log("INFO", format!("upload: video thumbnail saved at {}", thumbnail_absolute.display()).as_str());
      }

      _ => {
        file_type = "file";
      }
    }

    // ... store new file register in database ...
    let query = format!("
      INSERT INTO {}.files
      (uuid, type, extension, size, birthtime, path, description, folder_id) VALUES
      ($1  , $2  , $3       , $4  , $5::text::timestamp, $6  , $7         , $8)
      RETURNING uuid, extension, size, birthtime::text AS birthtime, path, description
    ", session.schema);

    let extension = mime.extension().to_string();
    let size = file_stats.len() as i64;
    let birthtime_str = birthtime.format("%Y-%m-%d %H:%M:%S").to_string();

    let row = match job.postgres.query_one(&query, &[
      &uuid,
      &file_type,
      &extension,
      &size,
      &birthtime_str,
      &file_relative,
      &params.file_name,
      &directory_id
    ]) {
      Ok(row) => row,
      Err(e) => {
        brook_http_worker::logger::log("ERROR", e.to_string().as_str());
        let _ = fs::remove_file(&file_absolute);
        let _ = fs::remove_file(&thumbnail_absolute);
        return self.exception_response(&mut job, "Internal server error", Some("DATABASE_ERROR"), None, None);
      }
    };

    let record = FileRecord {
      uuid: row.get("uuid"),
      extension: row.get("extension"),
      size: row.get("size"),
      birthtime: row.get("birthtime"),
      path: row.get("path"),
      description: row.get("description"),
    };

    self.success_response(&mut job, "File uploaded successfully", None, Some(serde_json::json!(record)), None);
  }

}

// ... generates a random uuid v4 string, avoids pulling the `uuid` crate for a single format ...
fn generate_uuid_v4() -> String {
  let mut bytes = [0u8; 16];
  for b in bytes.iter_mut() {
    *b = rand::random::<u8>();
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  format!(
    "{:02x}{:02x}{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
    bytes[0], bytes[1], bytes[2], bytes[3],
    bytes[4], bytes[5],
    bytes[6], bytes[7],
    bytes[8], bytes[9],
    bytes[10], bytes[11], bytes[12], bytes[13], bytes[14], bytes[15]
  )
}

// ... rename fails across filesystems (EXDEV), fallback to copy + remove ...
fn move_file(from: &Path, to: &Path) -> std::io::Result<()> {
  match fs::rename(from, to) {
    Ok(()) => Ok(()),
    Err(_) => {
      fs::copy(from, to)?;
      fs::remove_file(from)?;
      Ok(())
    }
  }
}

fn read_exif(path: &Path) -> Option<exif::Exif> {
  let file = fs::File::open(path).ok()?;
  let mut bufreader = std::io::BufReader::new(&file);
  exif::Reader::new().read_from_container(&mut bufreader).ok()
}

fn exif_orientation(exif: &exif::Exif) -> u32 {
  exif.get_field(exif::Tag::Orientation, exif::In::PRIMARY)
    .and_then(|f| f.value.get_uint(0))
    .unwrap_or(1)
}

fn exif_datetime(exif: &exif::Exif) -> Option<NaiveDateTime> {
  let field = exif.get_field(exif::Tag::DateTimeOriginal, exif::In::PRIMARY)
    .or_else(|| exif.get_field(exif::Tag::DateTime, exif::In::PRIMARY))?;

  if let exif::Value::Ascii(ref v) = field.value {
    let raw = v.first()?;
    let s = std::str::from_utf8(raw).ok()?.trim_end_matches('\0').trim();
    return NaiveDateTime::parse_from_str(s, "%Y:%m:%d %H:%M:%S").ok();
  }

  None
}

fn apply_exif_orientation(img: DynamicImage, orientation: u32) -> DynamicImage {
  match orientation {
    2 => DynamicImage::from(imageops::flip_horizontal(&img)),
    3 => DynamicImage::from(imageops::rotate180(&img)),
    4 => DynamicImage::from(imageops::flip_vertical(&img)),
    5 => {
      let rotated = imageops::rotate90(&img);
      DynamicImage::from(imageops::flip_horizontal(&rotated))
    }
    6 => DynamicImage::from(imageops::rotate90(&img)),
    7 => {
      let rotated = imageops::rotate270(&img);
      DynamicImage::from(imageops::flip_horizontal(&rotated))
    }
    8 => DynamicImage::from(imageops::rotate270(&img)),
    _ => img,
  }
}

fn generate_image_thumbnail(input: &Path, output: &Path) -> Result<(), Box<dyn std::error::Error>> {

  if let Some(parent) = output.parent() {
    fs::create_dir_all(parent)?;
  }

  // ... file has no extension, so the format must be guessed from its content ...
  let mut img = image::ImageReader::open(input)?
    .with_guessed_format()?
    .decode()?;

  if let Some(exif) = read_exif(input) {
    img = apply_exif_orientation(img, exif_orientation(&exif));
  }

  // ... never enlarge images smaller than the thumbnail size ...
  let thumbnail = if img.width() <= THUMBNAIL_MAX_SIZE && img.height() <= THUMBNAIL_MAX_SIZE {
    img
  } else {
    img.resize(THUMBNAIL_MAX_SIZE, THUMBNAIL_MAX_SIZE, imageops::FilterType::Lanczos3)
  };

  let file = fs::File::create(output)?;
  let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(file, THUMBNAIL_QUALITY);
  encoder.encode_image(&thumbnail.to_rgb8())?;

  Ok(())
}

fn generate_video_thumbnail(input: &Path, output: &Path) -> std::io::Result<()> {

  if let Some(parent) = output.parent() {
    fs::create_dir_all(parent)?;
  }

  let scale_filter = format!(
    "scale='min({0},iw)':'min({0},ih)':force_original_aspect_ratio=decrease",
    THUMBNAIL_MAX_SIZE
  );

  let status = Command::new("ffmpeg")
    .arg("-y")
    .arg("-i")
    .arg(input)
    .args(["-vf", &scale_filter, "-frames:v", "1", "-f", "mjpeg"])
    .arg(output)
    .status()?;

  if !status.success() {
    return Err(std::io::Error::other("ffmpeg failed to generate thumbnail"));
  }

  Ok(())
}

fn video_creation_time(path: &Path) -> Option<NaiveDateTime> {

  let output = Command::new("ffprobe")
    .args(["-v", "quiet", "-print_format", "json", "-show_entries", "format_tags=creation_time"])
    .arg(path)
    .output()
    .ok()?;

  if !output.status.success() {
    return None;
  }

  let json: serde_json::Value = serde_json::from_slice(&output.stdout).ok()?;
  let raw = json.get("format")?.get("tags")?.get("creation_time")?.as_str()?;
  let dt = DateTime::parse_from_rfc3339(raw).ok()?;

  Some(dt.naive_utc())
}
