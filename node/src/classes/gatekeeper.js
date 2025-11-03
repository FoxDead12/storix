import fs from 'fs';
import path from 'path';

export default class GATEKEEPER {

  constructor (namespace) {
    this.filePath = path.join(import.meta.dirname, '../gatekeeper/', namespace + '.json');
  }

  init () {
    global.logger.info('Loading gatekeeper routes');
    var content = fs.readFileSync(this.filePath, 'utf8');
    this.gatekeeper = JSON.parse(content);
    this.gatekeeper.map(route => {
      route['route'] = new RegExp(route['route']);
      if (route['role_mask']) {
        route['role_mask'] = parseInt(route['role_mask'], 16);
      }
    });
  }

  checkRoute (method, url) {
    return this.gatekeeper.find( route => url.match(route["route"]) && route.method.includes(method) );
  }

}
