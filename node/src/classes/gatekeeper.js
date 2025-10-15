import fs from 'fs';
import path from 'path';

export default class GATEKEEPER {
  constructor (namespace) {
    this.filePath = path.join(import.meta.dirname, '../gatekeeper/', namespace + '.json');
  }

  init () {
    var content = fs.readFileSync(this.filePath, 'utf8');
    this.gatekeeper = JSON.parse(content);
    this.gatekeeper.map(route => {
      route['route'] = new RegExp(route['route']);
      if (route['role_mask']) route['role_mask'] = parseInt(route['role_mask'], 16);
    });
  }

  checkRoute (method, url) {
    const gate = this.gatekeeper.find(route => url.match(route["route"]));
    if (!gate || !gate.method.includes(method)) {
      return null;
    } else {
      return gate;
    }
  }

}
