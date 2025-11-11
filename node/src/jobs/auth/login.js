import Job from "../../classes/job.js";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import ROLES from "../../classes/roles.js";

export default class Login extends Job {

  async perform (job) {
    const { email, password } = job.body;

    // ... get user from email ...
    let user = await this.db.query('SELECT id, name, email, encrypt_password, role_mask, u_schema FROM public.users WHERE email = $1 AND deleted = false', [email]);
    if ( !user?.rows[0] ) {
      return this.reportError({message: "Authentication failed, invalid credentials"});
    } else {
      user = user.rows[0];
    }

    // ... validate password ...
    const valid = await bcrypt.compare(password, user.encrypt_password);
    if ( !valid ) {
      return this.reportError({message: "Authentication failed, invalid credentials"});
    }

    // ... create session token ...
    const token = await this.generateToken(user.id);

    const client_ip = this.req.headers['x-real-ip'];
    if ( !client_ip ) {
      return this.reportError({message: "Authentication failed, can't read ip of client"});
    }

    // ... add session to token ...
    await this.addSessionToRedis(user.id, token, user.name, user.email, ROLES.tranform_byte_to_hex(user.role_mask), user.u_schema, client_ip);

    this.res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Strict`);
    // this.res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`);
    this.sendResponse({ message: 'Authentication was successful' });

  }

  async generateToken (user_id) {
    const hash = crypto.randomBytes(64).toString('base64')
    return `${user_id}-${hash}`;
  }

  async addSessionToRedis (user_id, token, name, email, role_mask, schema, client_ip) {

    const client_ip_hash = crypto.createHash('md5').update(client_ip, 'utf8').digest('hex');
    const prefix = 'user:token:' + client_ip_hash + ':';
    const redisKey = prefix + token;

    // ... delete user old sessions ...
    const redisUserKey = prefix + user_id + '-*';
    const oldSessions = await this.redis.keys(redisUserKey);
    if (oldSessions.length > 0) {
      await this.redis.del(oldSessions);
    }

    // ... add new session to redis ...
    const redisPayload = {
      id: user_id,
      name: name,
      email: email,
      role_mask: role_mask,
      schema: schema,
      client_ip: client_ip,
      login_at: new Date().getTime()
    };

    await this.redis.hSet(redisKey, redisPayload);
    await this.redis.expire(redisKey, 3600); // 1 - HOUR

  }

}
