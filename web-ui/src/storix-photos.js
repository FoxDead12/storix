import { html, LitElement, css } from "lit";

export default class StorixPhotos extends LitElement {

  static properties = {
    items: {
      type: Array
    },
    _page: {
      type: Number
    }
  }

  constructor () {
    super();
    this.items = [];
    this._page = 1;
  }

  render () {
    return html`

    `;
  }

  async fetchItems (page) {
    const items = await app.broker.get('files?page=1&photos=true');
  }

}

customElements.define('storix-photos', StorixPhotos);
