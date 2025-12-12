import { html, LitElement, css } from "lit";

export default class StorixActions extends LitElement {

  static styles = css`

    :host {
      position: fixed;
      bottom: 0%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: var(--primary-color);
      display: flex;
      gap: 0px;
      border-radius: 25px;
      box-shadow:
        0 1px 1px hsl(0deg 0% 0% / 0.075),
        0 2px 2px hsl(0deg 0% 0% / 0.075);
      overflow: hidden;
    }

  `;

  render () {
    return html`
      <slot name="content"></slot>
    `
  }

}

customElements.define('storix-actions', StorixActions)
