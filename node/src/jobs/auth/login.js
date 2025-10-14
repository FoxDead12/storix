import Job from "../../classes/job.js";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import ROLES from "../../classes/roles.js";

export default class Login extends Job {

  async perform (job) {

    const { email, password } = job.body;

    // ... get user from email ...
    let user = await this.db.query('SELECT id, name, email, encrypt_password, role_mask FROM public.users WHERE email = $1 AND deleted = false', [email]);
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

    // ... add session to token ...
    await this.addSessionToRedis(user.id, token, user.name, user.email, ROLES.tranform_byte_to_hex(user.role_mask));

    this.sendResponse({message: 'Authentication was successful', response: token});

  }

  async generateToken (user_id) {
    const date = new Date();

    const hash = crypto.createHash('sha512');
    hash.update(date.getTime().toString());
    hash.update(user_id.toString());

    return `${user_id}-${hash.digest('hex')}`;
  }

  async addSessionToRedis (user_id, token, name, email, role_mask) {

    const prefix = 'user:token:';
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
      login_at: new Date().getTime()
    };

    console.log(redisPayload)
    await this.redis.hSet(redisKey, redisPayload);
    await this.redis.expire(redisKey, 3600); // 1 - HOUR

  }

}
