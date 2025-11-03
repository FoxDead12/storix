import fs from 'fs';
import path from 'path';

export default class CONFIG {

  constructor (namespace) {
    this.filePath = path.join(import.meta.dirname, '../config/', namespace + '.json');
  }

  init () {
    global.logger.info('Loading config');
    var content = fs.readFileSync(this.filePath, 'utf8');
    return JSON.parse(content);
  }

}
