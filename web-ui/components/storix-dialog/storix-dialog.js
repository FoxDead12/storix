import { html, LitElement, css } from "lit";
import '../storix-icon.js';

export default class StorixDialog extends LitElement {

  static styles = css`
    dialog::backdrop {
      content: "";
      position: fixed;
      inset: 0px;
      background: rgba(0, 0, 0, .4);
      backdrop-filter: blur(2px);
    }

    dialog {
      width: 450px;
      padding: 12px 16px;
      border: none;
      border-radius: 8px;
      top: 0px;
      left: 0px;
      outline: none;
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
    }

    dialog[open] {
      display: flex;
      flex-direction: column;
    }

    .header {
      padding: 0px;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header > h1 {
      padding: 0px;
      margin: 0px;
      font-weight: normal;
      font-size: 16px;
    }
  `;

  render () {
    return html`
      <dialog id="dialog">

        <ol class="header">
          <h1>Title</h1>
          <storix-icon icon="plus" ></storix-icon>
        </ol>


        <div></div>


        <div class="footer">

        </div>

      </dialog>
    `;
  }

  firstUpdated () {
    this.dialog = this.shadowRoot.getElementById('dialog');
    this.dialog.showModal();
  }

}

customElements.define('storix-dialog', StorixDialog);
