
export default class Job {

  constructor (req, res, config) {
    this.req = req;
    this.res = res;
    this.config = config;
  }

  async execute () {
    try {
      await this.perform();
    } catch (err) {
      console.error(err)
    }
  }

  static get query () {
    return false;
  }
  static set query (pool) {
    this.db = pool;
  }

  static set transaction (con) {
    this.db = con;
  }
  static get transaction () {
    return false;
  }

}
