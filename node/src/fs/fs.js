import HTTP from "../classes/http.js";
import jobs from "../jobs/index.js";

export default class FS extends HTTP {

  constructor () {
    super('fs');
  }

  async handler ( client ) {

    const {req, res, route, session } = client;

    // ... get job name from gatekeeper ...
    if ( !route.job ) {
      throw new HTTPError("Gatekeeper don't define job", 400);
    }

    // ... get class name of job ...
    const job_instance_name = jobs[route.job];
    if ( !job_instance_name ) {
      throw new HTTPError("Job defined don't exist", 400);
    }

    const job   = new Object();
    job.body    = new Object();
    job.params  = new Object();

    if ( session ) {
      job.user_id     = session.id;
      job.user_schema = session.schema;
    }

    const url = new URL(req.url, `http://localhost/`);
    if ( url.searchParams.size > 0 ) {
      job.params = Object.fromEntries(url.searchParams.entries());
    }

    global.logger.info(`started job: ${route.job}, method: ${req.method}, job: ${JSON.stringify(job)}`);
    await (new job_instance_name(req, res, this)).perform(job);
    global.logger.info(`completed job: ${route.job}, method: ${req.method}, status: ${res.statusCode}`);

  }

}
