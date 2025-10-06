export default class Response {

  constructor () {

  }

  /**
   *
   * @param {res} Response
   * @param {status} HTTP status code response
   */
  send (res, status) {

    let response;
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');

    switch (status) {
      case 404: response = this.error('GATEKEEPER_NOT_FOUND'); break;
      case 500: response = this.error('BROKER_INTERNAL_ERROR'); break;
    }

    res.end(JSON.stringify(response));

  }

  /**
   *
   */
  error (code) {
    let detail;
    let title;
    switch (code) {
      case 'GATEKEEPER_NOT_FOUND':
        title = 'Not Found';
        detail = 'Resource not found';
        break;
      case 'BROKER_INTERNAL_ERROR':
        title = 'Internal error';
        detail = 'Internal server error';
        break;
    }
    return {errors: [{code: code, title: title, detail: detail}]}
  }

}
