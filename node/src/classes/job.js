import HELPER from "./helper.js";

export default class Job {

  constructor (req, res, server) {
    this.req = req;
    this.res = res;

    this.logger = global.logger;
    this.server = server;
    this.db = server.db;
    this.redis = server.redis;
    this.config = server.config;
    this.roles = server.roles.roles;
  }

  sendResponse (obj) {
    obj.res = this.res;
    HELPER.sendResponse(obj);
  }

  reportError (obj) {
    obj.res = this.res;
    HELPER.reportError(obj);
  }

}
