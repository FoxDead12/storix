import Job from "../../classes/job.js";

export default class FilesOps extends Job {

  async perform (job) {
    this.job = job;
    console.log(job)
    console.log(this.req.headers)

    switch (this.req.method) {
      case 'POST':
        await this.upload_file();
        break;
      default:
        return this.reportError({status: 405, message: "Method Not Allowed"});
    }

  }

  async upload_file () {



  }

  async delete_file () {}

}
