pub struct Role;

impl Role {
    pub const USER: i32 = 1;       // ... bit mask 00000001
    pub const ADMIN: i32 = 2;      // ... bit mask 00000010

    pub fn to_hex(mask: i32) -> String {
        return format!("{:#010x}", mask);
    }
}
