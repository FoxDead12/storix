import { css, html, LitElement } from "lit";
import { repeat } from 'lit/directives/repeat.js';
import '../components/storix-icon.js'

export default class StorixFiles extends LitElement {

  static styles = css`
    :host {
      overflow: hidden;
      height: 100%;
      margin: 12px 16px;
    }

    ul {
      max-height: 100%;
      list-style: none;
      padding: 0px;
      margin: 0px;
      gap: 0.5rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 200px));
      grid-auto-rows: 90px;
      overflow-y: auto;
      scrollbar-width: none;
    }

    li {
      position: relative;
      grid-column: span 1;
      grid-row: span 1;
      border-radius: 5px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 8px;
    }

    li:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    li > storix-icon {
      width: 48px;
      height: 48px;
      --icon-stroke-width: 1;
      margin: auto;
    }

    li > p {
      padding: 0px;
      margin: 0px;
      font-size: 14px;
      color: var(--text-color);
      text-align: center;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
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
    this.items = [];
    this.page = 1;
  }

  render () {
    return html`
      <ul class="files-list" id="files-list" @scroll=${this.onScroll.bind(this)}>
        ${repeat(this.items, (items) => items.id, this.renderItem.bind(this))}
      </ul>
    `
  }

  firstUpdated () {
    this.list = this.shadowRoot.getElementById('files-list');
  }


  updated (changeProps) {
    if ( changeProps.has('page') && !this._stopFetch) {
      this.fetchFiles();
    }
  }

  async fetchFiles () {

    const result = await app.broker.get('files?filter[p_files]=true&page=' + this.page);
    this.items.push(...result.response);

    this.requestUpdate();
    await this.updateComplete;

    // ... after lit render ...
    if ( result.response.length < 20 ) {
      this._stopFetch = true;
    } else {
      if ( this.list.clientHeight < this.clientHeight ) {
        this.page += 1;
      }
    }

  }

  onScroll (e) {
    if ( this._stopFetch ) return;

    const element = e.currentTarget;
    if ( element.offsetHeight + element.scrollTop >= element.scrollHeight - 100 ) {
      this.page += 1;
    }
  }

  renderItem (item) {

    console.log(item)

    return html`
      <li>
        <storix-icon icon="document"></storix-icon>
        <p>${item.description}</p>
      </li>
    `;

  }
}

customElements.define('storix-files', StorixFiles)
