import HTTP from "../classes/http.js";
import jobs from "../jobs/index.js";

export default class FS extends HTTP {

  constructor () {
    super('fs');
  }

  async handle (req, res, routeGatekeeper, user) {

    // ... get job key from gatekeeper ...
    const jobKey = routeGatekeeper.job;
    if (!jobKey) {
      return this.reportError(res, {status: 500, message: 'GATEKEEPER_JOB_NOT_DEFINE'});
    }

    // ... get job class from jobs array ...
    const jobClass = jobs[jobKey];
    if (!jobClass) {
      return this.reportError(res, {status: 500, message: 'JOB_NOT_EXIST'});
    }

    const jobPayload = {};

    if ( user ) {
      jobPayload.user_id = user.id;
      jobPayload.user_schema = user.schema;
    }

    jobPayload.params = Object.fromEntries(new URL(req.url, `http://${req.headers.host}`).searchParams.entries());

    const job = new jobClass(req, res, this);
    await job.perform(jobPayload);

  }

}
