import { html, LitElement, css } from "lit";

export default class StorixHome extends LitElement {

  static styles = css`
    :host {
      width: 100%;
      overflow: hidden;
    }
  `;

  render () {
    return html`
      <div class="container">
        HOME
      </div>
    `
  }

}

customElements.define('storix-home', StorixHome);
