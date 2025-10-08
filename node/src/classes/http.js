import http from 'http';
import CONFIG from './config.js';
import GATEKEEPER from './gatekeeper.js';
import DB from './db.js';

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
  }

  async perform () {
    await this._loadNecessaryDependencies();
    this._server = http.createServer(this.accept.bind(this));
    this._server.listen(this._port, this._host, this.listen.bind(this));
  }

  listen () {
    console.log(`Server running at http://${this._host}:${this._port}`);
  }

  async accept (req, res) {
    try {
      const routeGatekeeper = this._gatekeeper.checkRoute(req.method, req.url);
      if (!routeGatekeeper) {
        throw '404 NÃO TEM PERMISSÃO';
      }
      await this.handle(req, res, routeGatekeeper);
    } catch (err) {
      console.error(err);
    }
  }

  async _loadNecessaryDependencies () {
    this._config.init();
    this._port = this._config.port;
    this._host = this._config.host;
    // ...
    this._gatekeeper.init();
    await this._pooldb.init();
  }

  get config () {
    return this._config.config;
  }

}
