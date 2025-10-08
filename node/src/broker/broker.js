import HTTP from "../classes/http.js";
import jobs from "../jobs/index.js";

export default class Broker extends HTTP {

  constructor () {
    super('broker');
  }

  async handle (req, res, routeGatekeeper) {

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

    // ... create job instance ...
    const job = new jobClass(req, res, this);
    await job.perform();

  }

}
