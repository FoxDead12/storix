export default class  HELPER {

  static parseCookies (cookieString) {

    if (cookieString === "") {
      return {};
    }

    let pairs = cookieString.split(";");

    let splittedPairs = pairs.map(cookie => {
      let [key, ...value ] = cookie.split("=");
      value = value.join('=');
      return [key, value];
    });

    const cookieObj = splittedPairs.reduce(function (obj, cookie) {
      obj[decodeURIComponent(cookie[0].trim())] = decodeURIComponent(cookie[1].trim());
      return obj;
    }, {})

    return cookieObj;

  }

  static sendResponse ({
    res, req, message, response
  }) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    const payload = {
      status: 200,
      message: message,
      response: response
    };
    res.end(JSON.stringify(payload));
  }

  static reportError ({
    res, req, status = 400, message, response
  }) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    const payload = { status, message, response};
    res.end(JSON.stringify(payload));
  }

}
