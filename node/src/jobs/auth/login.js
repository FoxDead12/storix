import Job from "../../classes/job.js";

export default class Login extends Job {

  static get query () {
    return true;
  }

  static async perform () {
    console.log("CORRER LOGIN");
  }

}
