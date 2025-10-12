import Job from "../../classes/job.js";
import bcrypt from 'bcrypt';

export default class Login extends Job {

  async perform (job) {

    const { email, password } = job.body;

    // ... get user from email ...
    let user = await this.db.query('SELECT id, name, email, encrypt_password FROM public.users WHERE email = $1 AND deleted = false', [email]);
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

  }

}
