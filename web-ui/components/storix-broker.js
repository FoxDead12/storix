
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

  _getCookie (name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  // ... the access token lives 1h, so any long-running operation (a big upload batch,
  // someone leaving a tab open) will hit a 401 well before the user notices. Refreshing
  // here, shared through `refreshPromise` so concurrent requests don't each trigger their
  // own refresh, lets both normal api calls and the upload wizard's own XHR calls recover
  // transparently instead of failing the whole batch ...
  async refreshSession () {
    if (this.refreshPromise) return this.refreshPromise;

    const refresh_token = this._getCookie('refresh');
    if (!refresh_token) return Promise.reject(new Error('No refresh token available'));

    this.refreshPromise = (async () => {
      const response = await fetch(new URL('session-refresh', this.url), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
        credentials: 'include'
      });
      const result = await response.json();
      if (!response.ok) throw result;
      return result;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async _fetch (method, url, payload = null, _retried = false) {
    const path = new URL(url, this.url);
    const response = await fetch(path, {
      method: method,
      headers: { 'Content-Type': 'application/json', },
      body: payload ? JSON.stringify(payload) : null,
      credentials: 'include'
    });

    if (response.status === 401 && !_retried) {
      try {
        await this.refreshSession();
        return await this._fetch(method, url, payload, true);
      } catch (e) {
        // refresh itself failed (no/expired refresh token): fall through and
        // let the original 401 propagate so callers can redirect to /login
      }
    }

    const result = await response.json();
    if ( !response.ok ) throw result;
    return result;
  }

}
