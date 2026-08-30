use brook_http_worker::worker::job::JobAbstract;
use serde::Deserialize;
use serde_json::json;

use crate::auth::roles;
use crate::auth::session::Session;

pub struct RefreshTokenJob;

// ... brook (the HTTP bridge, outside this repo) never forwards cookies into the job
// payload for public/unauthenticated routes, so the `refresh` cookie is intentionally not
// HttpOnly: the frontend reads it via JS and sends it here as this JSON body field ...
#[derive(Deserialize)]
struct RefreshTokenRequestPayload {
    refresh_token: String
}

impl JobAbstract for RefreshTokenJob {

    fn perform(&self, mut job: brook_http_worker::worker::job::Job) {

        // ... parse body of request to see if match with internal struct ...
        let payload: RefreshTokenRequestPayload = match &job.payload {
            Some(raw) => {
                match serde_json::from_value::<RefreshTokenRequestPayload>(raw.clone()) {
                    Ok(p) => p,
                    Err(e) => {
                        brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                        return self.error_response(&mut job, "Refresh failed", Some("PAYLOAD_MISMATCH"), None, None);
                    }
                }
            }
            None => return self.error_response(&mut job, "Refresh failed", Some("MISSING_PAYLOAD"), None, None)
        };

        let old_refresh_token = payload.refresh_token.trim();
        if old_refresh_token.is_empty() || !old_refresh_token.contains('-') {
            return self.error_response(&mut job, "Refresh failed", Some("INVALID_TOKEN"), None, None);
        }

        // ... look up the session stored for this refresh token ...
        let redis_session = Session::get_session(&mut job, old_refresh_token);
        if redis_session.is_empty() {
            return self.error_response(&mut job, "Refresh failed, session expired", Some("SESSION_EXPIRED"), None, None);
        }

        let user_id: i32 = match redis_session.get("user_id").and_then(|v| v.parse::<i32>().ok()) {
            Some(id) => id,
            None => return self.exception_response(&mut job, "Internal server error", Some("SESSION_CORRUPTED"), None, None)
        };
        let user_name = redis_session.get("user_name").cloned().unwrap_or_default();
        let user_email = redis_session.get("user_email").cloned().unwrap_or_default();
        let user_schema = redis_session.get("user_schema").cloned().unwrap_or_default();
        let user_roles = redis_session.get("user_roles").cloned().unwrap_or_else(|| roles::Role::to_hex(roles::Role::USER));

        // ... rotate both tokens ...
        let access_token = Session::access_token_generate(user_id);
        let refresh_token = Session::refresh_token_generate(user_id);

        Session::create(
            &mut job,
            user_id,
            user_name,
            user_email,
            user_schema,
            user_roles,
            access_token.clone(),
            refresh_token.clone()
        );

        // ... the old refresh token must not be usable again ...
        Session::delete_session(&mut job, old_refresh_token);

        let headers = json!({
            "Set-Cookie": [
                format!("token={access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600"),
                // not HttpOnly: the frontend reads this cookie via JS to send it back as the
                // refresh_token body field on the next PATCH /api/session-refresh call
                format!("refresh={refresh_token}; Path=/; Secure; SameSite=Strict; Max-Age=172800")
            ]
        });

        self.success_response(&mut job, "Refresh was successful", None, None, Some(headers));
    }

}
