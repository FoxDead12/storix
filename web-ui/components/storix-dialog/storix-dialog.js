import { html, LitElement, css } from "lit";

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
      padding: 0px;
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
  `;

  render () {
    return html`
      <dialog id="dialog">
        <p>Greetings, one and all!</p>
        <form method="dialog">
          <button>OK</button>
        </form>
      </dialog>
    `;
  }

  firstUpdated () {
    this.dialog = this.shadowRoot.getElementById('dialog');
    this.dialog.showModal();
  }

}

customElements.define('storix-dialog', StorixDialog);
