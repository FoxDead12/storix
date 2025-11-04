import { html, LitElement, css } from "lit";
import { repeat } from 'lit/directives/repeat.js';

export default class StorixPhotos extends LitElement {

  static styles = css`
    :host {
      overflow: hidden;
      height: 100%;
    }

    ul {
      height: 100%;
      padding: 12px 16px;
      margin: 0px;
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      overflow-y: auto;
    }

    ul > li {
      background-color: #ccc;
    }
  `;

  static properties = {
    items: {
      typeof: Array
    },
    page: {
      typeof: Number
    }
  }

  constructor () {
    super();
    this.items = new Array();
    this.page = 1;
  }

  render () {
    return html`
      <ul class="files-list" id="files-list" >
        ${repeat(this.items, (items) => items.id, this.renderItem.bind(this))}
      </ul>
    `
  }

  firstUpdated () {
    this.fetchPhotos()
  }

  updated (changeProps) {
    console.log(changeProps)
  }

  async fetchPhotos () {

    const result = await app.broker.get('files?filter[p_photos]=true');
    this.items.push(...result.response);
    this.requestUpdate('items');

  }

  renderItem (item) {
    console.log(item)
    return html`
      <li>
        <img src="/fs/files/${item.uuid}" loading="lazy" width="500" />
      ${item.description}
      </li>
    `;
  }

}

customElements.define('storix-photos', StorixPhotos);
