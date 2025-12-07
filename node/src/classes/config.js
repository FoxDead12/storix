import fs from 'fs';
import path from 'path';
import os from 'os';

export default class CONFIG {

  constructor (namespace) {
    this.filePath = path.join(import.meta.dirname, '../config/', namespace + '.json');
  }

  init () {
    const hostname = os.hostname();
    var content = fs.readFileSync(this.filePath, 'utf8');
    return JSON.parse(content)[hostname];
  }

}
