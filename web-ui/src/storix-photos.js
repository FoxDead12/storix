import { html, LitElement, css } from "lit";
import { repeat } from 'lit/directives/repeat.js';
import { ref } from 'lit/directives/ref.js';

export default class StorixPhotos extends LitElement {

  static styles = css`

    .list-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .item-container {
      width: 100%;
      display: block;
      border-radius: 8px;
      object-fit: cover;
    }

  `;

  static properties = {
    _items: {
      type: Array
    },
    _grandTotal: {
      type: Number
    },
    _page: {
      type: Number
    }
  }

  constructor () {
    super();
    this._items = [];
    this._grandTotal = 0;
    this._page = 1;
  }

  async connectedCallback () {
    super.connectedCallback();
    await this._fetchGrandTotal();
    await this._fetchItems();
  }

  render () {
    return html`
      <ul class="list-container">
        ${repeat(this._items, (item) => item.uuid, this._renderItem.bind(this))}
      </ul>
    `;
  }



  // ---------------------------------- //
  //          PRIVATE METHODS           //
  // ---------------------------------- //

  async _fetchGrandTotal () {
    const grandTotal = await app.broker.get('files?mode=photos&count=true');
    this._grandTotal = grandTotal.response.count;
  }

  async _fetchItems () {
    const items = await app.broker.get(`files?mode=photos&page=${this._page}`);
    this._items = [...this._items, ...items.response];
  }



  // ---------------------------------- //
  //           RENDER METHODS           //
  // ---------------------------------- //

  _renderItem (item) {
    const url = new URL(`files/${item.uuid}`, window.FS_URL);

    const regex = /Bearer\s+([A-Za-z0-9]+-[A-Za-z0-9+\/]{86}==)/;
    const match = document.cookie.match(regex);

    fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${match[1]}`
      }
    })
    .then((response) => response.blob())
    .then((blob) => {
      const element = this.shadowRoot.getElementById(item.uuid);
      element.src = URL.createObjectURL(blob);
      console.log(element.src)
    });

    return html`
      <li class="item-container">
        <img id="${item.uuid}" width=300 />
      </li>
    `
  }

}

customElements.define('storix-photos', StorixPhotos);
