import fs from 'fs';
import path from 'path';

export default class CONFIG {

  constructor (namespace) {
    this.filePath = path.join(import.meta.dirname, '../config/', namespace + '.json');
  }

  init () {
    var content = fs.readFileSync(this.filePath, 'utf8');
    this.config = JSON.parse(content);
  }

  get port () {
    return this.config['port'];
  }

  get host () {
    return this.config['host'];
  }

}
