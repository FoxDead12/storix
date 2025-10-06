import http from 'http';
import path from 'path';
import fs from 'fs';
import Response from './response.js';

export default class BrookHttp {

  constructor (port, host) {
    this.port   = port;
    this.host   = host;
    this.server = null;
    this.response = new Response();
    this.helper = new BrookHelper();
  }

  async perform () {

    // ... create gatekeeper object ...
    this.gatekeeper = new Gatekeeper();
    await this.gatekeeper.load();

    // ... bind client handler to server ...
    this.server = http.createServer(this.accept.bind(this));

    // ... bind server to port and host ...
    this.server.listen(this.port, this.host, this.listen.bind(this));

  }

  /**
   * Function after bind in socket to address
   */
  listen () {
    console.log(`Server running at http://${this.host}:${this.port}`);
  }

  /**
   * Function to handle new connection in server
   * @param {req} Request reference
   * @param {res} Response reference
   */
  async accept (req, res) {

    try {

      // ... validate if request is valid ...
      const route = this.gatekeeper.validate(req);
      if (!route) {
        return this.response.send(res, 404);
      }

      // ... now execute necessary logic ...
      if (route?.job) {
        return await this.broker(req, res, route);
      }

    } catch (err) {
      console.error(err)
      return this.response.send(res, 500);
    }

    return this.response.send(res, 404);

  }

  /**
   * Function to handle new connection and execute logic of broker
   * @param {req} Request reference
   * @param {res} Response reference
   * @param {route} Route reference from gatekeeper
   */
  async broker (req, res, route) {

    // ... create job ...
    const job = await this.helper.instance_job(route.job);

    // ... execute perform of job ...
    await job.perform();

  }

  /**
   * Function to handle new connection and execute logic of file server
   * @param {req} Request reference
   * @param {res} Response reference
   */
  fs (req, res) {
  }

}

class Gatekeeper {

  constructor () {
    this.file = path.join(import.meta.dirname, '../config/gatekeeper.json');
    this.data = null;
  }

  async load () {
    this.data = fs.readFileSync(this.file, 'utf8');
    this.data = JSON.parse(this.data);
    this.data.map(route => route["route"] = new RegExp(route["route"]));
  }

  validate (req) {
    const route = this.data.find(route => req.url.match(route["route"]));

    if (!route) {
      return null;
    }

    if (!route.method.includes(req.method)) {
      return null;
    }

    return route;
  }

}

class BrookHelper {

  async instance_job (job_name) {

    // ... import module of job ...
    const module_path = path.join(import.meta.dirname, '../jobs', `${job_name}.js`);
    const module = await import(module_path);

    // ... create instance of job ...
    const job = new module.default();
    return job;

  }

}
