import Job from "../../classes/job.js";

export default class Login extends Job {

  async perform () {
    this.reportError({message: 'Password invalid!'});
  }

}
