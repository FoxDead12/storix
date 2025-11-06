import { html, LitElement, css } from "lit";
import { repeat } from 'lit/directives/repeat.js';

export default class StorixPhotos extends LitElement {

  static styles = css`
    :host {
      overflow: hidden;
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
      height: 100%;
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
    }

    ul > li > img,
    ul > li > video {
      object-fit: cover;
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

    if ( item.type === 'image' ) {
      return html`
        <li>
          <img alt="${item.description}" src="/fs/files/${item.uuid}" loading="lazy" @load=${this._onImageLoad.bind(this)} />
        </li>
      `;
    }

    if ( item.type === 'video' ) {
      return html`
        <li>
          <video src="/fs/files/${item.uuid}" loading="lazy" preload="metadata" controls @loadedmetadata=${this._onImageLoad.bind(this)}></video>
        </li>
      `;
    }

  }

  _onImageLoad (e) {
    const img = e.currentTarget;
    const parent = img.parentElement;

    const isLandscape = img.width > img.height;
    const isPortrait = img.height > img.width;

    img.style.width = '100%';
    img.style.height = '100%';

    if ( isLandscape ) {
      parent.setAttribute('style', 'grid-column: span 12; grid-row: span 24;');
    } else {
      parent.setAttribute('style', 'grid-column: span 6; grid-row: span 34;');
    }


    console.log({
      orientation: isLandscape ? 'horizontal' : 'vertical',
      width: img.width,
      height: img.height,
      isPortrait: isPortrait
    });

  }

}

customElements.define('storix-photos', StorixPhotos);
