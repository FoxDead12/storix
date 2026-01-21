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

    const session = {
      user_id: user.rows[0]["user_id"],
      user_name: user.rows[0]["user_name"],
      user_email: user.rows[0]["user_email"],
    }

    this.sendResponse({ response: session });

  }

}
