import { Pool } from 'pg'

export default class DB {

  connectionString = null;

  constructor (namespace) {
    const key = String(namespace).toUpperCase() + '_DB_STRING';
    this.connectionString = process.env[key];
    if (!this.connectionString) {
      global.logger.error(`Invalid key '${key}' in .env file`);
      throw `Invalid key '${key}' in .env file`;
    }
  }

  async init (maxConnections = 4) {
    global.logger.info('Create connections to postgres');
    this.connections = new Pool({
      connectionString: this.connectionString,
      max: maxConnections
    });
    return this.connections;
  }

}
