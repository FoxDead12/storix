import { LitElement } from "lit";

export default class StorixDialogPage extends LitElement {

  static properties = {
    dialog: {
      typeof: Object
    }
  }

  enter () {}

}

customElements.define('storix-dialog-page', StorixDialogPage);
