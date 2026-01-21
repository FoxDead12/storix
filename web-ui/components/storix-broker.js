
export default class StorixBroker {

  refreshPromise = null;

  constructor () {
    this.url = new URL('api/', window.origin).href;
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

    try {
      return await callRequest();
    } catch (err) {
      if (err.status !== 401) throw err;
      await this._refreshToken();
      return await callRequest();
    }

  }

  async _refreshToken () {
    if ( this.refreshPromise ) return this.refreshPromise;

    const path = new URL('session-refresh', this.url);

    this.refreshPromise = fetch(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', },
      body: JSON.stringify({}),
      credentials: 'include'
    }).then( res => {
      if (!res.ok) throw new Error('Refresh failed');
      return res.json();
    }).finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise
  }
}
