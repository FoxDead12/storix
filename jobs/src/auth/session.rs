use brook_http_worker;
use base64::Engine;
use redis::Commands;

pub struct Session;

impl Session {
    pub fn access_token_generate ( user_id: i32 ) -> String {
        // ... create random bytes ...
        let bytes: Vec<u8> = (0..64).map(|_| { rand::random::<u8>() }).collect();

        // ... convert to base 64 ...
        let bytes64 = base64::engine::general_purpose::STANDARD.encode(bytes);

        // ... return generate token ...
        return format!("{}-{}", user_id, bytes64);
    }

    pub fn refresh_token_generate ( user_id: i32 ) -> String {
        // ... create random bytes ...
        let bytes: Vec<u8> = (0..128).map(|_| { rand::random::<u8>() }).collect();

        // ... convert to base 64 ...
        let bytes64 = base64::engine::general_purpose::STANDARD.encode(bytes);

        // ... return generate token ...
        return format!("{}-{}", user_id, bytes64);
    }

    pub fn create (
        job: &mut brook_http_worker::worker::job::Job,
        user_id: i32,
        user_name: String,
        user_email: String,
        user_schema: String,
        user_roles: String,
        acces_token: String,
        refresh_token: String
    ) {

        // ... create access token in redis (access token) ...
        let redis_access_key = format!("user:token:{}", acces_token);
        let redis_access_payload = [
            ("user_id", user_id.to_string()),
            ("user_schema", user_schema.clone()),
            ("user_roles", user_roles.clone()),
            ("product_key", "storix".to_string())
        ];
        let redis_access_duration = 15 * 60 * 1000; // 15 minuts
        let _ = job.redis.hset_multiple::<&std::string::String, &str, std::string::String, String>(&redis_access_key, &redis_access_payload);
        let _ =job.redis.expire::<&std::string::String, String>(&redis_access_key, redis_access_duration);

        return;

        // ... create access token in redis (refresh token) ...
        let redis_refresh_key = format!("user:session:{}", refresh_token);
        let redis_refresh_payload = [
            ("user_id", user_id.to_string()),
            ("user_name", user_name),
            ("user_email", user_email),
            ("user_schema", user_schema),
            ("user_roles", user_roles),
            ("acces_refresh_tokentoken", refresh_token)
        ];
        let redis_refresh_duration = 2 * 24 * 60 * 60;  // 2 days
        let _ = job.redis.hset_multiple::<&std::string::String, &str, std::string::String, String>(&redis_refresh_key, &redis_refresh_payload);
        let _ = job.redis.expire::<&std::string::String, String>(&redis_refresh_key, redis_refresh_duration);

    }
}
