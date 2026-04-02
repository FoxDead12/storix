use argon2::PasswordVerifier;
use brook_http_worker::worker::job::JobAbstract;
use serde::{ Deserialize };
use serde_json::json;

pub struct LoginJob;

#[derive(Deserialize)]
struct LoginJobRequestPayload {
    email: String,
    password: String
}

impl JobAbstract for LoginJob {

  fn perform(&self, mut job: brook_http_worker::worker::job::Job) {

    // ... parse body of request to see if match with internal struct ...
    let payload: LoginJobRequestPayload = match &job.payload {
        Some(raw) => {
            match serde_json::from_value::<LoginJobRequestPayload>(raw.clone()) {
                Ok(p) => p,
                Err(e) => {
                    let msg = format!("Invalid JSON payload: {}", e);
                    return self.error_response(&mut job, &msg, Some("PAYLOAD_MISMATCH"), None, None);
                }
            }
        }
        None => return self.error_response(&mut job, "A JSON payload is required for this operation, but none was provided.", Some("MISSING_PAYLOAD"), None, None)
    };

    // ... in this moment we contain the valid payload ...
    // ... check if existe any user with email in comming ...
    let user = match job.postgres.query_opt("
        SELECT
            id,
            name,
            email,
            encrypt_password,
            role_mask,
            u_schema
        FROM public.users
        WHERE email = $1 AND deleted = false
    ", &[
        &payload.email
    ]) {
        Ok(Some(row)) => row,
        Ok(None) => {
            return self.error_response(&mut job, "Authentication failed. Please check your login details.", Some("AUTH_FAILED"), None, None);
        }
        Err(e) => {
            eprintln!("[DB Error] {}", e);
            return self.exception_response(&mut job, "Internal server error.", Some("DB_ERROR"), None, None);
        }
    };

    // ... convert database string to struct ...
    let password: String = user.get("encrypt_password");
    let parsed_hash = match argon2::password_hash::PasswordHash::new(&password) {
        Ok(parsed_hash) => parsed_hash,
        Err(e) => {
            eprintln!("[DB Error] {}", e);
            return self.exception_response(&mut job, "Internal server error.", Some("PASSWORD_HASH"), None, None);
        }
    };

    // ... compare strings, to check password ...
    let argon2 = argon2::Argon2::default();
    match argon2.verify_password(payload.password.as_bytes(), &parsed_hash) {
        Ok(_) => {},
        Err(e) => {
            return self.error_response(&mut job, "Authentication failed. Please check your login details.", Some("AUTH_FAILED"), None, None);
        }
    };

    // ... create session in redis ...
    let access_token = crate::auth::session::Session::access_token_generate(user.get("id"));
    let refresh_token = crate::auth::session::Session::refresh_token_generate(user.get("id"));

    // ... at this point user is logged, use email and password ...
    // ... create custom headers to pass to http response ...
    let headers = json!({
        "Set-Cookie": [
            format!("token={access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900"),
            format!("refresh={refresh_token}; Path=/api/session-refresh; HttpOnly; Secure; SameSite=Strict; Max-Age=172800")
        ]
    });

    self.success_response(&mut job, "Processado com sucesso", Some("Need send all payload"), None, Some(headers));
  }

}
