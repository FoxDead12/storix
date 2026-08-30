import { a as i, i as i$1 } from './lit-element-build.js';

class StorixBroker {

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

class StorixToast extends i {

  static styles = i$1 `
    :host {
      position: fixed;
      right: 0px;
      bottom: 0px;
      padding: 0px;
      margin: 0px;
      gap: 12px;
      padding: 12px 12px;
      display: flex;
      flex-direction: column;
      display: flex;
      justify-content: flex-start; /* alinha no início, sem forçar espaço igual */
      align-items: flex-end;
      pointer-events: none; /* pai não recebe clique */
    }

    .toast {
      pointer-events: auto; /* filhos ainda recebem clique */
      flex: 0 0 auto; /* não cresce nem encolhe */
      width: auto;
      min-width: 300px;
      position: relative;
      padding: 12px 18px;
      border-radius: 3px;
      border-left: 10px solid;
      cursor: pointer;
      box-shadow:
        0 1px 1px hsl(0deg 0% 0% / 0.075),
        0 2px 2px hsl(0deg 0% 0% / 0.075);
    }

    .toast::before {
      content: '';
      position: absolute;
      width: 100%;
      background: #fff;
      height: 100%;
      left: 0px;
      top: 0px;
      z-index: -1;
    }

    .toast > p {
      padding: 0px;
      margin: 0px;
      font-size: 16px;
      font-weight: normal;
      color: var(--text-color);
    }

    .toast > p:first-child {
      font-size: 13px;
      font-weight: bold;
    }

    .toast.success {
      border-color: #17B978;
      background: rgb(23 185 120 / 25%);
    }

    .toast.warning {
      border-color: #FBC02D;
      background: rgb(251 192 45 / 25%);
    }

    .toast.error {
      border-color: #D50000;
      background: rgb(213 0 0 / 20%);
    }

    .toast.info {
      border-color: #0004FF;
      background: rgb(0 4 255 / 20%);
    }

  `;

  openToast ({ message, duration, status, no_duration }) {

    const element = document.createElement('div');
    const title = document.createElement('p');
    const text = document.createElement('p');

    element.classList.add('toast');
    element.classList.add(status);

    text.innerHTML = message;
    switch (status) {
      case 'success': title.innerHTML = 'Success'; break;
      case 'warning': title.innerHTML = 'Error'; break;
      case 'error': title.innerHTML = 'Warning'; break;
      case 'info': title.innerHTML = 'Info'; break;

    }

    element.appendChild(title);
    element.appendChild(text);
    this.shadowRoot.appendChild(element);

    element.addEventListener('click', () => element.remove());

    if ( !no_duration ) {
      setTimeout(() => element.remove(), duration || 3000);
    }

    return element;
  }

}

customElements.define('storix-toast', StorixToast);

export { StorixBroker as S };
