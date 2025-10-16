import HTTP from "../classes/http.js";
import jobs from "../jobs/index.js";

export default class Broker extends HTTP {

  constructor () {
    super('broker');
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

    // ... create job instance ...
    const jobPayload = {};

    if ( user ) {
      jobPayload.user_id = user.id;
      jobPayload.user_schema = user.schema;
    }

    if (req.method == 'POST' || req.method == 'PATCH') {
      const body = await this.parseBody(req);
      jobPayload.body = JSON.parse(body);
    } else {
      jobPayload.body = {};
    }

    jobPayload.params = Object.fromEntries(new URL(req.url, `http://${req.headers.host}`).searchParams.entries());

    const job = new jobClass(req, res, this);
    await job.perform(jobPayload);

  }

  async parseBody (req) {
    return await new Promise((res, rej) => {
      const body = [];
      req.on('data', chunk => {
        body.push(chunk);
      })
      .on('end', () => {
        res(Buffer.concat(body).toString());
      })
      .on('error', err => {
        rej(err);
      })
    });
  }

}
