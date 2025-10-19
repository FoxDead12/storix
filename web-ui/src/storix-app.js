import { html, css, LitElement } from 'lit';
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

    window.app = this;
  }

  render () {
    return html `
      <storix-login></storix-login>
    `
  }

}

window.customElements.define('storix-app', StorixApp);
