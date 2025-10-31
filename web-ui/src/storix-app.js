import { html, css, LitElement } from 'lit';
import StorixBroker from '../components/storix-broker.js';
import '../components/storix-toast.js';
import './storix-header.js'
import './storix-home.js';

export default class StorixApp extends LitElement {

  static styles = css `
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
  `

  constructor () {
    super();
    window.app = this;
    this.session = {};
    this.broker = new StorixBroker();
  }

  async connectedCallback () {
    await this._fetchUserSession();
    super.connectedCallback();
  }

  render () {
    return html `
      <storix-header></storix-header>
      <storix-home></storix-home>
      <storix-toast id="toast" ></storix-toast>
    `
  }

  firstUpdated () {
    this.toast = this.shadowRoot.getElementById('toast');
  }

  // ********************************************* //
  // Session methods                               //
  // ********************************************* //

  async _fetchUserSession () {
    try {
      const data = await this.broker.get('session');
      this.session.user = data.response;
    } catch (e) {
      window.location.href = '/login';
    }
  }

  // ********************************************* //
  // GET methods                                   //
  // ********************************************* //

  openToast (payload) {
    this.toast.openToast(payload);
  }
}

window.customElements.define('storix-app', StorixApp);
