import Job from "../../classes/job.js";
import Login from "./login.js";
import ROLES from "../../classes/roles.js";

export default class RefreshToken extends Job {

  async perform (job) {

    // ... create class login because contain methods to generate new session ...
    const loginClass = new Login(this.req, this.res, this.server);

    // ... get user from id ...
    let user = await this.db.query('SELECT id, name, email, encrypt_password, role_mask, u_schema FROM public.users WHERE id = $1 AND deleted = false', [job.user_id]);
    if ( !user?.rows[0] ) {
      return this.reportError({message: "Refresh failed, user don't exist"});
    } else {
      user = user.rows[0];
    }

    // ... generate new token ...
    const token = await loginClass.generateToken(job.user_id);

    const client_ip = this.req.headers['x-real-ip'];
    if ( !client_ip ) {
      return this.reportError({message: "Refresh failed, can't read ip of client"});
    }

    // ... add session to token ...
    await loginClass.addSessionToRedis(user.id, token, user.name, user.email, ROLES.tranform_byte_to_hex(user.role_mask), user.u_schema, client_ip);

    this.res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Strict`);
    this.sendResponse({ message: 'Refresh was successful' });


  }

}
