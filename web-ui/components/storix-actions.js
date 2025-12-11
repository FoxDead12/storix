import { html, LitElement, css } from "lit";

export default class StorixActions extends LitElement {

  static styles = css`

    :host {
      position: fixed;
      bottom: 24px;
      left: auto;
      right: auto;

      background-color: red;
      padding: 10px;
    }

  `;

  render () {
    return html`
    OLLAA
    `
  }

}

customElements.define('storix-actions', StorixActions)
