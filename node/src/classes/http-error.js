
export default class HTTPError extends Error {

  constructor (message, status) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.status = status;
  }

}
