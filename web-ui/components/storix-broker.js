
export default class StorixBroker {

  refreshPromise = null;

  constructor (url = "api/") {
    this.url = new URL(url, window.origin).href;
  }

  async get (url) {
    return await this._fetch('GET', url);
  }

  async post (url, payload) {
    return await this._fetch('POST', url, payload);
  }

  async patch (url, payload) {
    return await this._fetch('PATCH', url, payload);
  }

  async delete (url) {
    return await this._fetch('DELETE', url);
  }

  async _fetch (method, url, payload = null) {
    const path = new URL(url, this.url);
    const callRequest = async () => {
      const response = await fetch(path, {
        method: method,
        headers: { 'Content-Type': 'application/json', },
        body: payload ? JSON.stringify(payload) : null,
        credentials: 'include'
      });
      const result = await response.json();
      if ( !response.ok ) throw result;
      return result;
    }
    return await callRequest();
  }

}
