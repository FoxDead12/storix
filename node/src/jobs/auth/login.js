import Job from "../../classes/job.js";
import bcrypt from 'bcrypt';
import ROLES from "../../classes/roles.js";
import Session from "../../classes/session.js";

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

    const access_token = Session.generate_access_token(user.id);
    const refresh_token = Session.generate_refresh_token(user.id);

    await Session.add_to_redis(this.redis, {
      user_id:      user.id,
      user_name:    user.name,
      user_email:   user.email,
      user_schema:  user.u_schema,
      user_roles:   ROLES.tranform_byte_to_hex(user.role_mask),
      access_token: access_token,
      refresh_token: refresh_token,
      client_ip: this.req.headers['x-real-ip']
    })

    this.res.setHeader('Set-Cookie', [
      `token=${access_token}; Path=/; HttpOnly; Secure; SameSite=Strict`,
      `refresh=${refresh_token}; Path=/api/session-refresh; HttpOnly; Secure; SameSite=Strict`
    ]);
    this.sendResponse({ message: 'Authentication was successful' });

  }

}
