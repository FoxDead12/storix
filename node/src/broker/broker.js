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
      throw '500 ERRO INTERNO, NAO TEM JOB DEFINIDO NO GATEKEEPER';
    }

    // ... get job class from jobs array ...
    const jobClass = jobs[jobKey];
    if (!jobClass) {
      throw '500 ERRO INTERNO, NAO TEM JOB DEFINIDO NO FICHEIRO DE JOBS';
    }

    // ... create job instance ...
    const job = new jobClass(req, res, this);
    await job.perform();

  }

}
