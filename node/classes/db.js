import pg, { Pool } from 'pg'

export default class DB {

  constructor () {
  }

  async load (config) {

    const {user, password, host, port, database} = config.parse_db();

    this.pool = new Pool({
      user: user,
      password: password,
      host: host,
      port: port,
      database: database
    });
  }

  async connection () {
    return await this.pool.connect();
  }

  async free (client) {
    client.release();
  }

}
