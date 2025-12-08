import fs from 'fs/promises';
import path from 'path';
import { setInterval } from 'timers/promises';

export default class LOGGER {

  constructor (config) {
    this.levels = ['debugger', 'info', 'error'];
    this.dir = config.logger.directory;
    this.level = this.levels.indexOf(config.logger.level);
    this.daemon = config?.daemon != undefined ? config.daemon : true;
    this.file = null;
    this._event();
  }

  info (message) {
    this.log('info', message);
  }

  debugger (message) {
    this.log('debugger', message);
  }

  error (message) {
    this.log('error', message);
  }

  async log (level, context) {

    // ... validate level of logger ...
    const i = this.levels.indexOf(level);
    if (i < this.level) return;

    const date = new Date().toISOString();
    const message = `[${date}][${level.toUpperCase()}] ${context}`;

    this._write(message);

  }

  async _event () {

    // ... calculate time to next mid night time ...
    const now = new Date();
    const next = new Date();
    next.setHours(24, 0, 0, 0);

    // ... calculate delay to timeoute ...
    const delay = next - now;

    // ... create event to execute in next midnigth ...
    setTimeout(() => {
      this._open();
      this._event();
    }, delay);

  }

  // ... method to open file to logger ...
  async _open () {
    const date = new Date();
    this.file = path.join(this.dir, date.toISOString().slice(0, 10).replace(/-/g, '-').toString() + '.log');
    // ... create file if dont exist ...
    await fs.mkdir(this.dir, { recursive: true });
  }

  // ... method to write the messages in log file ...
  async _write (message) {
    if ( !this.file ) {
      await this._open();
    }

    if ( this.daemon ) {
      console.log(message);
    } else {
      await fs.writeFile(this.file, message + '\n', { flag: 'a+' });
    }
  }

}
