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
    const job = new jobClass(req, res, this._config);

    // // ... set options of job ...
    // if (job.transaction === true) {
    //   const con = await this._pooldb.getConn();
    //   job.transaction(con);
    // } else if (job.query === true) {
    //   job.query(this.pooldb);
    // }

  }

  async job (req, res, routeGatekeeper) {

    const jobKey = routeGatekeeper.job;
    const jobClass = jobs[jobKey];
    if (!jobClass) {
      throw '500 ERRO INTERNO, NAO TEM JOB DEFINIDO NO FICHEIRO DE JOBS';
    }

    const db = await this._pooldb.getConn();
    const job = new jobClass(req, res, this._config, {db: db});
    await job.perform();
    this._pooldb.freeCon(db);
  }

}
