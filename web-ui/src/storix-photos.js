import { html, LitElement, css } from "lit";
import { repeat } from 'lit/directives/repeat.js';

export default class StorixPhotos extends LitElement {

  static styles = css`
    :host {
      overflow: hidden;
      display: flex;
    }

    ul {
      list-style: none;
      padding: 12px 16px;
      margin: 0px;
      gap: 1rem;
      display: grid;
      grid-template-columns: repeat(24, 1fr);
      grid-auto-rows: 1fr;
      grid-auto-flow: dense;
      overflow-y: auto;
    }

    @media (max-width: 3440px) {
      ul {
        grid-template-columns: repeat(42, 1fr);
      }
    }

    @media (max-width: 3439px) {
      ul {
        grid-template-columns: repeat(36, 1fr);
      }
    }

    @media (max-width: 2560px) {
      ul {
        grid-template-columns: repeat(30, 1fr);
      }
    }

    @media (max-width: 1920px) {
      ul {
        grid-template-columns: repeat(24, 1fr);
      }
    }

    @media (max-width: 1440px) {
      ul {
        grid-template-columns: repeat(18, 1fr);
      }
    }

    @media (max-width: 1024px) {
      ul {
        grid-template-columns: repeat(12, 1fr);
      }
    }

    @media (max-width: 768px) {
      ul {
        grid-template-columns: 1fr;
      }

      ul > li {
        grid-column: span 1 !important; /* 👈 força cada item a ocupar só 1 coluna */
        grid-row: 1fr !important;
      }
    }

    ul > li {
      aspect-ratio: 1 / 1;
      grid-column: span 6;
      grid-row: span 34;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #ccc;
      box-shadow:
      0 1px 1px hsl(0deg 0% 0% / 0.075),
      0 2px 2px hsl(0deg 0% 0% / 0.075),
      0 4px 4px hsl(0deg 0% 0% / 0.075),
      0 8px 8px hsl(0deg 0% 0% / 0.075),
      0 16px 16px hsl(0deg 0% 0% / 0.075);
      border-radius: 5px;
      overflow: hidden;
    }

    ul > li > img,
    ul > li > video {
      object-fit: cover;
    }

    ul > li > video:-webkit-full-screen,
    ul > li > img:-webkit-full-screen {
      object-fit: contain;
    }

    ul > li > video:-moz-full-screen,
    ul > li > img:-moz-full-screen {
      object-fit: contain;
    }
  `;

  static properties = {
    _stopFetch: {
      typeof: Boolean
    },
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
    this._stopFetch = false;
    this.page = 0;
  }

  render () {
    return html`
      <ul class="files-list" id="files-list" @scroll=${this.onScroll.bind(this)}>
        ${repeat(this.items, (items) => items.id, this.renderItem.bind(this))}
      </ul>
    `
  }

  updated (changeProps) {
    if ( changeProps.has('page') && !this._stopFetch) {
      this.fetchPhotos()
    }
  }

  async fetchPhotos () {

    const result = await app.broker.get('files?filter[p_photos]=true&page=' + this.page);
    this.items.push(...result.response);
    this.requestUpdate();
    if ( result.response.length < 20 ) {
      this._stopFetch = true;
    }

  }

  _onImageLoad (e) {
    const img = e.currentTarget;
    const parent = img.parentElement;

    const isLandscape = img.width > img.height;

    img.style.width = '100%';
    img.style.height = '100%';

    if ( isLandscape ) {
      parent.setAttribute('style', 'grid-column: span 12; grid-row: span 24;');
    } else {
      parent.setAttribute('style', 'grid-column: span 6; grid-row: span 34;');
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

    return html`
      <li>
        <img alt="${item.description}" src="/fs/files/${item.uuid}" loading="lazy" @load=${this._onImageLoad.bind(this)} />
      </li>
    `;

  }
}

customElements.define('storix-photos', StorixPhotos);
