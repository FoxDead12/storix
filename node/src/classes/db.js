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

  async query (query, params = []) {
    return await this.pool.query(query, params);
  }

  freeConn (con) {
    con.release();
  }

}
