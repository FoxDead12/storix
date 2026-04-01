use brook_http_worker::worker::job::JobAbstract;
use serde::{ Deserialize };

pub struct RegisterJob;

#[derive(Deserialize)]
struct RegisterJobRequestPayload {
    name: String,
    email: String,
    password: String
}

impl JobAbstract for RegisterJob {

    fn perform(&self, mut job: brook_http_worker::worker::job::Job) {

        // ... parse body of request to see if match with internal struct ...
        let payload: RegisterJobRequestPayload = match &job.payload {
            Some(raw) => {
                match serde_json::from_value::<RegisterJobRequestPayload>(raw.clone()) {
                    Ok(p) => p,
                    Err(e) => {
                        let msg = format!("Invalid JSON payload: {}", e);
                        return self.error_response(&mut job, &msg, Some("PAYLOAD_MISMATCH"), None);
                    }
                }
            }
            None => return self.error_response(&mut job, "A JSON payload is required for this operation, but none was provided.", Some("MISSING_PAYLOAD"), None)
        };

        // ... in this moment we contain the valid payload ...
        // ... check if existe any user with email in comming ...
        self.success_response(&mut job, "Processado com sucesso", Some("Need send all payload"), None);
    }

}
