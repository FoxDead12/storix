use argon2::{Argon2, PasswordHasher};
use brook_http_worker::worker::job::JobAbstract;
use serde::{ Deserialize, Serialize };

use crate::auth::roles;

pub struct RegisterJob;

#[derive(Deserialize)]
struct RegisterJobRequestPayload {
    name: String,
    email: String,
    password: String
}

#[derive(Serialize)]
struct RegisterJobResponsePayload {
    id: i32,
    name: String,
    email: String
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
                        return self.error_response(&mut job, &msg, Some("PAYLOAD_MISMATCH"), None, None);
                    }
                }
            }
            None => return self.error_response(&mut job, "A JSON payload is required for this operation, but none was provided.", Some("MISSING_PAYLOAD"), None, None)
        };

        // ... in this moment we contain the valid payload ...
        // ... check if existe any user with email in comming ...
        match job.postgres.query_opt("
            SELECT email
            FROM public.users
            WHERE email = $1
            LIMIT 1
        ", &[
            &payload.email
        ]) {
            Ok(Some(_row)) => {
                return self.error_response(&mut job, "User already exists. Please use another email.", Some("USER_EXISTS"), None, None);
            },
            Ok(None) => {},
            Err(e) => {
                eprintln!("[DB Error] {}", e);
                return self.exception_response(&mut job, "Internal server error.", Some("DB_ERROR"), None, None);
            }
        }

        // ... at this point we know email is valid to create user ...
        // ... encrypt the password to store in database ...
        let salt = argon2::password_hash::SaltString::generate(argon2::password_hash::rand_core::OsRng);
        let argon2 = Argon2::default();

        // ... generate hash password ...
        let password_hash = match argon2.hash_password(payload.password.clone().as_bytes(), &salt) {
            Ok(password_hash) => password_hash.to_string(),
            Err(e) => {
                eprintln!("[DB Error] {}", e);
                return self.exception_response(&mut job, "Internal server error.", Some("PASSWORD_HASH"), None, None);
            }
        };

        // ... create user in database ...
        let user = match job.postgres.query_one("
            INSERT INTO public.users
                (name, email, encrypt_password, role_mask)
            VALUES
                ($1, $2, $3, $4::int::bit(8))
            RETURNING id, name, email
        ", &[
            &payload.name,
            &payload.email,
            &password_hash,
            &roles::Role::USER
        ]) {
            Ok(user) => {
                RegisterJobResponsePayload {
                    id: user.get("id"),
                    name: user.get("name"),
                    email: user.get("email")
                }
            },
            Err(e) => {
                eprintln!("[DB Error] {}", e);
                return self.exception_response(&mut job, "Internal server error.", Some("DB_ERROR"), None, None);
            }
        };

        self.success_response(&mut job, "User account successfully created", Some("Your account has been registered in our system."), Some(serde_json::json!(user)), None);
    }

}
