
export default class Job {

  constructor (req, res, server) {
    this.req = req;
    this.res = res;
    this.logger = server.logger;
    this.db = server._pooldb.con;
    this.redis = server._poolRedis.con;
    this.config = server.config;
    this.roles = server.roles.roles;
  }

  sendResponse ({message, response}) {

    this.res.statusCode = 200;
    this.res.setHeader('Content-Type', 'application/json');

    const payload = {
      status: 200,
      message: message,
      response: response
    };
    this.res.end(JSON.stringify(payload));

  }

  reportError ({message, response, status = 400}) {

    this.res.statusCode = status;
    this.res.setHeader('Content-Type', 'application/json');

    const payload = {
      status: status,
      message: message,
      response: response
    };
    this.res.end(JSON.stringify(payload));

  }

}
