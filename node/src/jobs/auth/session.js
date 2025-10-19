import Job from "../../classes/job.js";

export default class Session extends Job {

  async perform (job) {

    let user = await this.db.query(
      'SELECT id, name, email FROM public.users WHERE id = $1 AND deleted = false',
      [job.user_id]
    );

    if ( !user || !user.rows[0] ) {
      return this.reportError({message: "User not found"});
    }

    this.sendResponse({ response: user.rows[0] });

  }

}
