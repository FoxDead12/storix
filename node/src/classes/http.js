import http from 'http';
import crypto from 'crypto';
import LOGGER from './logger.js';
import CONFIG from './config.js';
import GATEKEEPER from './gatekeeper.js';
import ROLES from './roles.js';
import REDIS from './redis.js';
import DB from './db.js';
import HTTPError from './http-error.js';
import HELPER from './helper.js';


export default class HTTP {

  constructor (namespace) {
    // ... variables of class ...
    this.namespace  = namespace;
    this.gatekeeper = new Array();
    this.config      = new Object();
    this.redis      = new Object();
    this.db         = new Object();
    this.roles      = new Object();
    this.server     = new Object();
  }

  listen () {
    global.logger.info(`Server running at http://${this.config.host}:${this.config.port}`);
  }

  async perform () {
    await this.beforeStart();
    await this.start();
  }

  async beforeStart () {

    // ... load configuration of server ...
    this.config = new CONFIG(this.namespace).init();

    // ... create logger to server ...
    global.logger = new LOGGER(this.config);

    // ... load array of gatekeeper of server ...
    this.gatekeeper = new GATEKEEPER(this.namespace);
    this.gatekeeper.init();

    // ... create redis connections ...
    this.redis = await (new REDIS()).init();

    // ... create postgres connections
    this.db = await (new DB(this.namespace)).init();

    // ... load roles from postgres ...
    const _roles = await this.db.query('SELECT * FROM roles');
    this.roles = new ROLES(_roles.rows);

  }

  async start () {
    this.server = http.createServer(this.accept.bind(this));
    this.server.listen(this.config.port, this.config.host, this.listen.bind(this));
  }

  async accept (req, res) {

    // ... object to send to children ...
    const client = { req, res, route: null, session: null };

    try {

      // ... check route is valid from gatekeeper ...
      client.route = this.gatekeeper.checkRoute(req.method, req.url);
      if ( !client.route ) {
        throw new HTTPError('Not found', 404);
      }

      // ... check session from client request ...
      if ( client.route.role_mask ) {
        client.session = await this.check_session(req, client.route.role_mask);
      }

      // ... execute logic of server (broker or fs) ...
      await this.handler(client);

    } catch (e) {

      if (res.headersSent) {
        global.logger.error('Response already sent to client, cannot report error again.');
        global.logger.error(e)
        return;
      }

      if ( e instanceof HTTPError ) {
        HELPER.reportError({ res: res, status: e.status, message: e.message });
      } else {
        global.logger.error(e.message);
        HELPER.reportError({ res: res, status: 500, message: 'Internal Server Error' });
      }

    }

  }

  async check_session (req, route_mask) {

    let token = null;

    // ... token comming in autorizathion header ...
    if ( req?.headers?.authorization ) {

      const regex_auth = /^Bearer\s+([A-Za-z0-9]+-[A-Za-z0-9+\/]{86}==)$/;
      const match = req.headers.authorization.match(regex_auth);
      if ( match ) {
        token = match[1];
      } else {
        throw new HTTPError('Unauthorized', 401);
      }

    // ... token comming in cookies header ...
    } else if ( req?.headers?.cookie ) {

      const cookies = HELPER.parseCookies(req.headers.cookie);
      const regex_cookie = /^([A-Za-z0-9]+-[A-Za-z0-9+\/]{86}==)$/;
      if ( cookies?.token ) {
        const match = cookies.token.match(regex_cookie);
        if ( match ) {
          token = match[1];
        } else {
          throw new HTTPError('Unauthorized', 401);
        }
      } else {
        throw new HTTPError('Unauthorized', 401);
      }

    } else  {
      throw new HTTPError('Unauthorized', 401);
    }

    // ... get session object from redis ...
    const client_ip_hash = crypto.createHash('md5').update(req.headers['x-real-ip'], 'utf8').digest('hex');
    const session_key = 'user:token:' + client_ip_hash + ':' + token;
    const session_obj = await this.redis.hGetAll(session_key);
    if ( !session_obj || Object.keys(session_obj).length == 0 ) {
      throw new HTTPError('Unauthorized', 401);
    }

    // ... check role mask from user and route ...
    const role_mask = parseInt(session_obj.role_mask, 16);
    if ( !(role_mask & route_mask) ) {
      throw new HTTPError('Forbidden', 403);
    }

    return session_obj;
  }

}
