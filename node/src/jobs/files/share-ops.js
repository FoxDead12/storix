import Job from "../../classes/job.js";

export default class ShareOps extends Job {

  async perform (job) {
    this.job = job;

    switch (this.req.method) {
      case 'POST': await this.post(); break;
      default: return this.reportError({status: 405, message: "Method Not Allowed"});
    }

  }

  // ... method will generate token to another user download file ...
  async post () {
    console.log(this.job)
  }

}
