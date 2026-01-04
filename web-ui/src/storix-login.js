import { html, css, LitElement } from 'lit';
import StorixBroker from '../components/storix-broker.js'
import '../components/storix-toast.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-button/paper-button.js';
import '../components/storix-icon.js';

export default class StorixLogin extends LitElement {

  static styles = css`

    :host {
      display: flex;
      width: 100%;
      height: 100%;
    }

    form {
      display: flex;
      flex-direction: column;
      background: #fff;
      width: 450px;
      border-radius: 10px;
      margin: auto;
      padding: 16px 12px;
      gap: 12px;
      box-shadow:
        0 1px 1px hsl(0deg 0% 0% / 0.075),
        0 2px 2px hsl(0deg 0% 0% / 0.075),
        0 4px 4px hsl(0deg 0% 0% / 0.075),
        0 8px 8px hsl(0deg 0% 0% / 0.075),
        0 16px 16px hsl(0deg 0% 0% / 0.075);
    }

    h1 {
      padding: 0px;
      margin: 0px;
      color: var(--primary-color);
      font-size: 32px;
      text-transform: uppercase;
      text-align: center;
    }

    paper-input {
      font-family: 'Poppins', sans-serif;
      --paper-input-container-input-color:  var(--text-color); /* azul */
    }

    paper-button {
      background-color: var(--primary-color);
      color: #fff;
      font-family: 'Poppins', sans-serif;
      font-weight: bold;
      letter-spacing: 1px;
      margin: 0px;
      margin-top: 32px;
    }

    storix-icon {
      cursor: pointer;
      --icon-fill: var(--text-color);
    }

    @media (max-width: 768px) {
      form {
        width: 80%;
      }
    }

  `;

  static properties  = {
    _passwordIconState: {
      type: Boolean
    }
  }

  constructor () {
    super();
    this.broker = new StorixBroker();
    this._passwordIconState = true;
  }

  render () {
    return html `
      <form id="form" @submit=${this.login.bind(this)}>
        <h1>Login</h1>
        <paper-input id="email" label="Email *" ></paper-input>
        <paper-input id="password" type="${this._passwordIconState == true ? 'password' : 'text'}" label="Password *">
          <storix-icon slot="suffix" icon="${this._passwordIconState == true ? 'eye' : 'eye-slash'}" @click=${this._showIconState.bind(this)} ></storix-icon>
        </paper-input>
        <paper-button raised @click=${() => {this.form.requestSubmit()}} >Enter</paper-button>
      </form>

      <storix-toast id="toast" ></storix-toast>
    `
  }

  firstUpdated () {
    this.toast = this.shadowRoot.getElementById('toast');
    this.form = this.shadowRoot.getElementById('form');
    this.form.addEventListener("keydown", (e) => {
      if (e.key === 'Enter') this.login(e);
    })
  }

  _showIconState () {
    this._passwordIconState = !this._passwordIconState;
  }

  async login (e) {
    e.preventDefault();

    try {

      const email = this.shadowRoot.getElementById('email').value;
      const password = this.shadowRoot.getElementById('password').value;

      if ( !email ) {
        return this.toast.openToast({ message: 'Is necessary indicate email to login', status: 'error' });
      }

      if ( !password ) {
        return this.toast.openToast({ message: 'Is necessary indicate password', status: 'error' });
      }

      await this.broker.post('login', { email, password });
      window.location.href = '/';

    } catch (e) {
      this.toast.openToast({ message: e.message, status: 'error' });
    }

  }

}

window.customElements.define('storix-login', StorixLogin);
