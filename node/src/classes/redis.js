import { createClient } from 'redis';

export default class REDIS {

  connectionString = null;

  constructor () {
    this.connectionString = process.env['REDIS_CONNECTION'];
  }

  async init () {
    this.connection = createClient({ url: this.connectionString });
    this.connection.on("error", this.onError.bind(this));
    this.connection.on('connect', this.onConnect.bind(this));
    await this.connection.connect();
  }

  onError (err) {
    console.error(err);
  }

  onConnect () {
  }

  get con () {
    return this.connection;
  }

}
