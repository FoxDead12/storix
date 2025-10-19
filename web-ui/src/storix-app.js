import { html, css, LitElement } from 'lit';
import StorixBroker from '../components/storix-broker.js';
import '../components/storix-toast.js';

import './storix-login.js'

export default class StorixApp extends LitElement {

  static styles = css `
    :host {
      display: flex;
      width: 100%;
      height: 100%;
    }
  `

  constructor () {
    super();
    this.broker = new StorixBroker();
    window.app = this;
  }

  render () {
    return html `
      <storix-toast id="toast" ></storix-toast>
    `
  }

  firstUpdated () {
    this.toast = this.shadowRoot.getElementById('toast');
  }

  openToast (payload) {
    this.toast.openToast(payload);
  }
}

window.customElements.define('storix-app', StorixApp);
