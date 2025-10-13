export default class LOGGER {

  info (message) {
    console.log(this._format('INFO', message));
  }

  error (message) {
    console.error(this._format('ERROR', message));
  }

  _timestamp () {
    const date = new Date();
    return date.toISOString().replace('T', ' ').split('.')[0];
  }

  _format (level, message) {
    return `[${this._timestamp()}][${level}] ${message}`;
  }

}
