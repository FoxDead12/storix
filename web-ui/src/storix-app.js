import { html, css, LitElement } from 'lit';
import StorixBroker from '../components/storix-broker.js';
import '../components/storix-toast.js';
import './storix-header.js'
import './storix-preview.js'
import '../components/storix-dialog/storix-dialog.js'

import './storix-photos.js';
import './storix-files.js'

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
      <!-- <storix-files></storix-files> -->
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
  async importModule (src) {
    await import(src);
  }

  openToast (payload) {
    this.toast.openToast(payload);
  }

  openDialog (dialog) {
    const component = document.createElement('storix-dialog');
    component.options = dialog;
    document.body.append(component);
  }

  openPreview (item) {
    const preview = document.createElement("storix-preview");
    preview.item = item;
    this.shadowRoot.append(preview);
  }

}

window.customElements.define('storix-app', StorixApp);
