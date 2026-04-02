use std::fmt::format;

use base64::Engine;

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

    pub fn create () {

    }
}
