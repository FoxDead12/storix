import http from 'http';
import https from 'https';
import CONFIG from './config.js';
import GATEKEEPER from './gatekeeper.js';
import DB from './db.js';
import REDIS from './redis.js';
import LOGGER from './logger.js';
import ROLES from './roles.js';
import fs from 'fs';
import cookieParser from "cookie-parser";

export default class HTTP {

  // ... server props ...
  _port = null;
  _host = null;
  _server = null;

  // ... server dependences ...
  _config = null;
  _gatekeeper = null;
  _pooldb = null;

  constructor (namespace) {
    this._config = new CONFIG(namespace);
    this._gatekeeper = new GATEKEEPER(namespace);
    this._pooldb = new DB(namespace);
    this._poolRedis = new REDIS();
    this.logger = new LOGGER();
  }

  async perform () {
    await this._loadNecessaryDependencies();

    if ( this._config.config.https ) {
      const options = {
        key: fs.readFileSync(this._config.config.https.private_key),
        cert: fs.readFileSync(this._config.config.https.certificate)
      }
      this._server = https.createServer(options, this.accept.bind(this));
    } else {
      this._server = http.createServer(this.accept.bind(this));
    }
    this._server.listen(this._port, this._host, this.listen.bind(this));
  }

  listen () {
    if ( this._config.config.https ) {
      console.log(`Server running at https://${this._host}:${this._port}`);
    } else {
      console.log(`Server running at http://${this._host}:${this._port}`);
    }
  }

  async accept (req, res) {

    res.setHeader('Access-Control-Allow-Origin', `${req.headers.origin}`); // ou use o domínio específico
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method == 'OPTIONS') {
      res.writeHead(204);
      res.end();
      this.logger.info(`${req.method} ${req.url} ${res.statusCode}`);
      return;
    }

    let user = null;

    try {

      // ... check route in gatekeeper ...
      const routeGatekeeper = this._gatekeeper.checkRoute(req.method, req.url);

      if (!routeGatekeeper) {
        return this.reportError(res, {status: 404, message: 'GATEKEEPER_NOT_FOUND'})
      }

      // ... validate user session ...
      if (routeGatekeeper.role_mask) {

        const session = req?.headers?.authorization || this.parseCookies(req?.headers?.cookie).token;
        if ( !session ) {
          return this.reportError(res, {status: 401, message: 'BROKER_UNAUTHORIZED'});
        }

        const regex = /^Bearer\s+([A-Za-z0-9]+-[a-fA-F0-9]+)$/;
        const match = session.match(regex);
        if ( !match ) {
          return this.reportError(res, {status: 401, message: 'BROKER_UNAUTHORIZED'});
        }

        const token = match[1];
        user = await this._poolRedis.con.hGetAll('user:token:' + token);
        if ( !user ) {
          return this.reportError(res, {status: 401, message: 'BROKER_UNAUTHORIZED'});
        }

        if ( !(parseInt(user.role_mask, 16) & routeGatekeeper.role_mask) ) {
          return this.reportError(res, {status: 403, message: 'BROKER_FORBIDDEN'});
        }

      }

      // ... execute logic to handle request ...
      await this.handle(req, res, routeGatekeeper, user);

    } catch (err) {
      console.error(err);

      if (err?.constructor?.name == 'DatabaseError') {
        this.logger.error(err.message);
        this.logger.error(err.detail);
        this.reportError(res, {status: 400, message: 'The provided data does not meet the required criteria'});
      } else {
        this.logger.error(err);
        this.reportError(res, {status: 500, message: 'An unexpected error occurred'})
      }
    }

    this.logger.info(`${req.method} ${req.url} ${res.statusCode}`);
  }

  async _loadNecessaryDependencies () {
    this._config.init();
    this._port = this._config.port;
    this._host = this._config.host;
    // ...
    this._gatekeeper.init();
    await this._pooldb.init();
    await this._poolRedis.init();

    // ... load possible roles from database ...
    const roles = await this._pooldb.con.query('SELECT * FROM roles');
    this.roles = new ROLES(roles.rows);

  }

  parseCookies(cookieHeader) {
    if (!cookieHeader) return {};

    // Divide cada cookie "chave=valor" e transforma em objeto
    return Object.fromEntries(
      cookieHeader.split("; ").map(cookie => {
        const [name, ...rest] = cookie.split("="); // separa chave e valor
        const value = rest.join("=");             // caso o valor tenha '='
        return [name, decodeURIComponent(value)]; // decodifica URI
      })
    );
  }

  reportError (res, {status, message, response}) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    const payload = {
      status: status,
      message: message,
      response: response
    };
    res.end(JSON.stringify(payload));
  }

  get config () {
    return this._config.config;
  }

}
