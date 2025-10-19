import { html, css, LitElement } from 'lit';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-button/paper-button.js';

export default class StorixLogin extends LitElement {

  static styles = css `
    :host {
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

    form {
      display: flex;
      flex-direction: column;
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
      font-family: 'Poppins';
      color: var(--text-color);
    }

    paper-button {
      background-color: var(--primary-color);
      color: #fff;
      font-family: 'Poppins';
      font-weight: bold;
      letter-spacing: 1px;
      margin: 0px;
      margin-top: 32px;
    }

  `;

  render () {
    return html `
      <form>
        <h1>Login</h1>
        <paper-input label="Email *" ></paper-input>
        <paper-input label="Password *"></paper-input>
        <paper-button raised>Enter</paper-button>
      </form>
    `
  }

  async login () {

  }

}

customElements.define('storix-login', StorixLogin)
