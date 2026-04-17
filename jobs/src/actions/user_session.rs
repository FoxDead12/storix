use brook_http_worker::worker::job::JobAbstract;
use serde::{ Deserialize, Serialize };
use serde_json::Number;


pub struct UserSession;

#[derive(Deserialize, Debug)]
struct SessionPayload {
  user_id: i32
}

#[derive(Serialize)]
struct User {
    user_id: i32,
    user_name: String,
    user_email: String
}

impl JobAbstract for UserSession {

  fn perform(&self, mut job: brook_http_worker::worker::job::Job) {

    // ... check if session json is valid ...
    let session: SessionPayload = match &job.session {
      Some(raw) => {
          match serde_json::from_value::<SessionPayload>(raw.clone()) {
              Ok(p) => p,
              Err(e) => {
                    brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                  return self.exception_response(&mut job, "Internal server error", Some("PAYLOAD_MISMATCH"), None, None);
              }
          }
      }
      None => return self.exception_response(&mut job, "Internal server error", Some("MISSING_PAYLOAD"), None, None)
    };

    // ... get necessary information of user ...
    let user = match job.postgres.query_one("
        SELECT id, name, email
        FROM public.users
        WHERE id = $1 AND deleted = false
    ", &[
            &session.user_id
        ],
    ) {
        Ok(row) => {
            User {
            user_id: row.get("id"),
            user_name: row.get("name"),
            user_email: row.get("email")
            }
        },
        Err(e) => {
            brook_http_worker::logger::log("ERROR", e.to_string().as_str());
            return self.exception_response(&mut job, "Internal server error", Some("DATABASE_ERROR"), None, None);
        }
    };

    self.success_response(&mut job, "User data get successfully", Some("User data get successfully"), Some(serde_json::json!(user)), None);
  }

}
