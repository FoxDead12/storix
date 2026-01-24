import Job from "../../classes/job.js";
import HELPER from '../../classes/helper.js';
import Session from "../../classes/session.js";

export default class RefreshToken extends Job {

  async perform (job) {

    // ... parse regex token from HTTP cookies ...
    const cookies = HELPER.parseCookies(this.req.headers.cookie);
    if ( !cookies.refresh ) {
      return this.reportError({message: "Refresh failed"});
    }

    const regex_cookie = /^([A-Za-z0-9]+-[A-Za-z0-9+\/]{171}=)$/;
    if ( !regex_cookie ) {
      return this.reportError({message: "Refresh failed"});
    }

    const match = cookies.refresh.match(regex_cookie);
    if ( !match ) {
      return this.reportError({message: "Refresh failed"});
    }

    const token = match[0];
    const redis_session = await Session.get_session(this.redis, token);
    if ( !redis_session || Object.keys(redis_session).length == 0 ) {
      // ... session expired ...
      return this.reportError({message: "Refresh failed, session expired"});
    }

    const access_token = Session.generate_access_token(redis_session['user_id']);
    const refresh_token = Session.generate_refresh_token(redis_session['user_id']);

    await Session.add_to_redis(this.redis, {
      user_id: redis_session['user_id'],
      user_name: redis_session['user_name'],
      user_email: redis_session['user_email'],
      user_schema: redis_session['user_schema'],
      user_roles: redis_session['user_role_mask'],
      access_token: access_token,
      refresh_token: refresh_token,
      client_ip: this.req.headers['x-real-ip']
    });

    // ... delete old refresh token ...
    await Session.delete_session(this.redis, token);

    this.res.setHeader('Set-Cookie', [
      `token=${access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900`,
      `refresh=${refresh_token}; Path=/api/session-refresh; HttpOnly; Secure; SameSite=Strict; Max-Age=172800`
    ]);
    this.sendResponse({ message: 'Refresh was successful' });

  }

}
