import Job from "../../classes/job.js";
import bcrypt from 'bcrypt';

export default class Register extends Job {

  async perform (job) {

    const { name, email, password } = job.body;

    // ... check email is not in use ...
    const repeatEmail = await this.db.query('SELECT COUNT(id) FROM public.users WHERE email = $1', [email]);
    if (repeatEmail?.rows[0] && repeatEmail?.rows[0].count != '0') {
      return this.reportError({message: 'Email already in use'});
    }

    // ... encrypt password ...
    const encryptPassword = await bcrypt.hash(password, 10);

    // ... create user ...
    const user = await this.db.query('INSERT INTO public.users (name, email, encrypt_password, role_mask) VALUES ($1, $2, $3, $4::int::bit(8)) RETURNING id, name, email', [name, email, encryptPassword, this.roles['USER']]);
    return this.sendResponse({message: 'User account successfully created', response: user.rows[0]});

  }

}
