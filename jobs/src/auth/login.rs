use brook_http_worker::worker::job::JobAbstract;
use serde::{ Deserialize };

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
                    return self.success_response(&mut job, &msg, Some("PAYLOAD_MISMATCH"), None);
                }
            }
        }
        None => return self.success_response(&mut job, "A JSON payload is required for this operation, but none was provided.", Some("MISSING_PAYLOAD"), None)
    };

    // ... in this moment we contain the valid payload ...
    // ... check if existe any user with email in comming ...
    let user = match job.postgres.query_opt("
        SELECT id, name, email, encrypt_password, role_mask, u_schema
        FROM public.users
        WHERE email = $1 AND deleted = false
    ", &[
        &payload.email
    ]) {
        Ok(Some(row)) => row,
        Ok(None) => {
            return;
        }
        Err(e) => {
            return;
        }
    };

    // let user = await this.db.query('SELECT id, name, email, encrypt_password, role_mask, u_schema FROM public.users WHERE email = $1 AND deleted = false', [email]);


    self.success_response(&mut job, "Processado com sucesso", Some("Need send all payload"), None);
  }

}
