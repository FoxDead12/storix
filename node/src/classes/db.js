import { Pool } from 'pg'

export default class DB {

  connectionString = null;

  constructor (namespace) {
    const key = String(namespace).toUpperCase() + '_DB_STRING';
    // ...
    this.connectionString = process.env[key];
    // ...
    if (!this.connectionString) {
      throw `Invalid key '${key}' in .env file`;
    }
  }

  async init (maxConnections = 10) {
    this.pool = new Pool({ connectionString: this.connectionString, max: maxConnections });
  }

  async getConn () {
    await this.pool.connect();
  }

  freeConn (con) {
    con.release();
  }

  get con () {
    return this.pool;
  }

}
