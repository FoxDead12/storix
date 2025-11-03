import { html, css, LitElement } from 'lit';
import StorixBroker from '../components/storix-broker.js';
import '../components/storix-toast.js';
import './storix-header.js'
import './storix-photos.js';
import '../components/storix-dialog/storix-dialog.js'

export default class StorixApp extends LitElement {

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
  `

  constructor () {
    super();
    window.app   = this;
    this.broker  = new StorixBroker();
    this.session = new Object();
  }

  async connectedCallback () {
    await this._fetchUserSession();
    super.connectedCallback();
  }

  render () {
    return html `
      <storix-header></storix-header>
      <storix-photos></storix-photos>
      <storix-toast id="toast" ></storix-toast>
    `
  }

  firstUpdated () {
    this.toast = this.shadowRoot.getElementById('toast');
    this.openDialog();
  }

  // ********************************************* //
  // Session methods                               //
  // ********************************************* //

  async _fetchUserSession () {
    try {
      const data = await this.broker.get('session');
      this.session.user_id    = data.response.id;
      this.session.user_name  = data.response.name;
      this.session.user_email = data.response.email;
    } catch (e) {
      window.location.href = '/login';
    }
  }

  // ********************************************* //
  // app methods                                   //
  // ********************************************* //

  openToast (payload) {
    this.toast.openToast(payload);
  }

  openDialog (dialog) {
    const component = document.createElement('storix-dialog');
    document.body.append(component);
  }

}

window.customElements.define('storix-app', StorixApp);
