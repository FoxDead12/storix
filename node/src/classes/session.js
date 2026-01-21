import crypto from 'crypto';

export default class Session {

  static generate_access_token (user_id) {
    const hash = crypto.randomBytes(64).toString('base64');
    return `${user_id}-${hash}`;
  }

  static generate_refresh_token (user_id) {
    const hash = crypto.randomBytes(128).toString('base64');
    return `${user_id}-${hash}`;
  }

  static async add_to_redis (redis, {
    user_id,
    user_name,
    user_email,
    user_schema,
    user_roles,
    access_token,
    refresh_token,
    client_ip
  }) {

    await Session.add_to_redis_session(redis, {
      user_id: user_id,
      user_name: user_name,
      user_email: user_email,
      user_schema: user_schema,
      user_roles: user_roles,
      refresh_token: refresh_token,
      client_ip: client_ip
    });

    await Session.add_to_redis_access(redis, {
      user_id: user_id,
      user_name: user_name,
      user_email: user_email,
      user_schema: user_schema,
      user_roles: user_roles,
      access_token: access_token,
      client_ip: client_ip
    });

  }

  static async add_to_redis_session (redis, {
    user_id,
    user_name,
    user_email,
    user_schema,
    user_roles,
    refresh_token,
    client_ip
  }) {
    const date = new Date();
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

    const redis_session = 'user:session:' + refresh_token;

    const redis_session_payload = {
      user_id: user_id,
      user_name: user_name,
      user_email: user_email,
      user_schema: user_schema,
      user_role_mask: user_roles,
      client_ip: client_ip,
      refresh_token: refresh_token,
      created_at: date.getTime(),
      expires_at: date.getTime() + TWO_DAYS
    }
    console.log("ADICIONEI UMA SESSAO AO REDIS")
    await redis.hSet(redis_session, redis_session_payload);
    await redis.expire(redis_session, (TWO_DAYS / 1000)); // convert TWO_DAYS to seconds
  }

  static async add_to_redis_access (redis, {
    user_id,
    user_name,
    user_email,
    user_schema,
    user_roles,
    access_token,
    client_ip
  }) {
    const date = new Date();
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    const redis_access = 'user:token:' + access_token;

    const redis_access_payload = {
      user_id: user_id,
      user_name: user_name,
      user_email: user_email,
      user_schema: user_schema,
      user_role_mask: user_roles,
      client_ip: client_ip,
      created_at: date.getTime(),
      expires_at: date.getTime() + FIFTEEN_MINUTES
    }

    await redis.hSet(redis_access, redis_access_payload);
    await redis.expire(redis_access, (FIFTEEN_MINUTES / 1000)); // convert FIFTEEN_MINUTES to seconds
  }

  static async get_session (redis, refresh_token) {
    const redis_session = 'user:session:' + refresh_token;
    return await redis.hGetAll(redis_session);
  }

  static async delete_session (redis, refresh_token) {
    const redis_session = 'user:session:' + refresh_token;
    return await redis.del(redis_session);
  }

}
