import { createClient } from 'redis';

export default class REDIS {

  connectionString = null;

  constructor () {
    this.connectionString = process.env['REDIS_CONNECTION'];
  }

  // ... TODO, in feature, only exist one connection to redis ...
  async init () {
    global.logger.info('Creating connections to redis');
    this.connection = createClient({ url: this.connectionString });
    this.connection.on("error", this.onError.bind(this));
    this.connection.on('connect', this.onConnect.bind(this));
    await this.connection.connect();
    return this.connection;
  }

  onError (err) {
    console.error(err);
    global.logger.error(err);
  }

  onConnect () {
    global.logger.info("Connections of redis successfully connected");
  }

}
