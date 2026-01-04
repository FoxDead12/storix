import HTTPError from "../classes/http-error.js";
import HTTP from "../classes/http.js";
import jobs from "../jobs/index.js";

export default class Broker extends HTTP {

  constructor () {
    super('broker');
  }

  async parse_body (req) {
    return await new Promise((res, rej) => {
      const body = [];
      req
        .on('data', chunk => body.push(chunk))
        .on('end', () => {
          try {
            res(JSON.parse(Buffer.concat(body).toString()))
          } catch (e) {
            rej(new HTTPError('Invalid body of json', 400));
          }
        })
        .on('error', err => rej(err))
    });
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

    if ( req.method === 'POST' || req.method === 'PATCH' ) {
      job.body = await this.parse_body(req);
    }

    const url = new URL(req.url, `http://localhost/`);
    if ( url.searchParams.size > 0 ) {
      job.params = Object.fromEntries(url.searchParams.entries());
    }

    if (route.job == 'login' || route.job == 'register') {
      global.logger.info(`started job: ${route.job} method: ${req.method} email: ${job.body.email} `);
    } else {
      global.logger.info(`started job: ${route.job}, method: ${req.method}, job: ${JSON.stringify(job)}`);
    }

    await (new job_instance_name(req, res, this)).perform(job);

    global.logger.info(`completed job: ${route.job}, method: ${req.method}, status: ${res.statusCode}`);


  }

//   async handle (req, res, routeGatekeeper, user) {
//
//     // ... get job key from gatekeeper ...
//     const jobKey = routeGatekeeper.job;
//     if (!jobKey) {
//       return this.reportError(res, {status: 500, message: 'GATEKEEPER_JOB_NOT_DEFINE'});
//     }
//
//     // ... get job class from jobs array ...
//     const jobClass = jobs[jobKey];
//     if (!jobClass) {
//       return this.reportError(res, {status: 500, message: 'JOB_NOT_EXIST'});
//     }
//
//     // ... create job instance ...
//     const jobPayload = {};
//
//     if ( user ) {
//       jobPayload.user_id = user.id;
//       jobPayload.user_schema = user.schema;
//     }
//
//     if (req.method == 'POST' || req.method == 'PATCH') {
//       const body = await this.parseBody(req);
//       jobPayload.body = JSON.parse(body);
//     } else {
//       jobPayload.body = {};
//     }
//
//     jobPayload.params = Object.fromEntries(new URL(req.url, `http://${req.headers.host}`).searchParams.entries());
//
//     const job = new jobClass(req, res, this);
//     await job.perform(jobPayload);
//
//   }
//
//   async parseBody (req) {
//     return await new Promise((res, rej) => {
//       const body = [];
//       req
//         .on('data', chunk => body.push(chunk))
//         .on('end', () => res(Buffer.concat(body).toString()))
//         .on('error', err => rej(err))
//     });
//   }

}
