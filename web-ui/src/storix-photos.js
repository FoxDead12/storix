import { html, LitElement, css, render } from "lit";
import { repeat } from 'lit/directives/repeat.js';
import '../components/storix-icon.js';

export default class StorixPhotos extends LitElement {

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
      gap: 1rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      grid-auto-rows: 100px;
      overflow-y: auto;
    }


    ul > li {
      position: relative;
      grid-column: span 2;
      grid-row: span 3;
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

    ul > .separator {
      grid-column: 1/-1;
      grid-row: span 1;
      box-shadow: none;
      background-color: transparent;
    }

    ul > li > img {
      object-fit: cover;
      color: transparent;
    }

    .video-container {
      position: absolute;
      left: 0px;
      top: 0px;
      width: 100%;
      height: 100%;
    }

    .video-container paper-button {
      width: 100%;
      height: 100%;
    }

    video {
      position: absolute;
      object-fit: cover;
      left: 0px;
      top: 0px;
      width: 100%;
      height: 100%;
    }

    video:-webkit-full-screen,
    img:-webkit-full-screen {
      object-fit: contain;
    }

    video:-moz-full-screen,
    img:-moz-full-screen {
      object-fit: contain;
    }

    .video-camera-icon {
      color: var(--primary-color);
      border-radius: 50%;
      background: #fff;
      padding: 8px;
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

  firstUpdated () {
    this.list = this.shadowRoot.getElementById('files-list');
  }

  updated (changeProps) {
    if ( changeProps.has('page') && !this._stopFetch) {
      this.fetchPhotos();
    }
  }

  async fetchPhotos () {

    const result = await app.broker.get('files?filter[p_photos]=true&page=' + this.page);

    let idx = 0;
    for ( const item of result.response ) {

      if ( this.currentDate != item.birthtime_date ) {
        this.currentDate = item.birthtime_date;
        const separator = { separator: true, date: item.birthtime_date };
        result.response.splice(idx, 0, separator);
      }

      idx++;
    }

    this.items.push(...result.response);
    this.requestUpdate();

    await this.updateComplete;

    if ( result.response.length < 20 ) {
      this._stopFetch = true;
    } else {
      if ( this.list.clientHeight < this.clientHeight ) {
        this.page += 1;
      }
    }

  }

  _onImageLoad (e) {

    const img = e.currentTarget;
    const parent = img.parentElement;

    const isLandscape = img.width > img.height;

    img.style.width = '100%';
    img.style.height = '100%';

    if (isLandscape) {
      parent.setAttribute('style', 'grid-column: span 4; grid-row: span 2;');
    } else {
      parent.setAttribute('style', 'grid-column: span 2; grid-row: span 3;');
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if ( img.src == window.location.href ) {
            const uuid = img.getAttribute('uuid');
            img.setAttribute('src', `/fs/files/${uuid}?filter[thumbnail]=true`);
          }
        } else {
          img.setAttribute('src', ``);
        }
      });
    },{
      root: null, // null = viewport do browser
      rootMargin: '100px 0px 100px 0px', // margem superior e inferior de 200px
      threshold: 0 // ativa assim que entra nessa margem
    });

    observer.observe(img);

  }

  onScroll (e) {
    if ( this._stopFetch ) return;

    const element = e.currentTarget;
    if ( element.offsetHeight + element.scrollTop >= element.scrollHeight - 100 ) {
      this.page += 1;
    }
  }

  _renderVideo (e) {
    const item = e.currentTarget.item;
    const element = document.createElement('video');

    element.src = `fs/files/${item.uuid}`;
    element.loading = "lazy";
    element.controls = true;
    element.autoplay = true;
    element.addEventListener('blur', () => {
      element.pause();
      element.removeAttribute('src'); // remove a origem
      element.load(); // força reset do player
      element.remove(); // agora pode remover do DOM
    });

    e.currentTarget.parentElement.append(element);

    setTimeout(() => {
      element.focus();
    }, 100);
  }

  renderItem (item) {

    if ( item.separator === true ) {
      return html`
        <li class="separator">
      separator
        </li>
      `
    } else {
      return html`
        <li>
          <img src="/fs/files/${item.uuid}?filter[thumbnail]=true" alt="${item.description}" uuid=${item.uuid} loading="lazy" @load=${this._onImageLoad.bind(this)} />
          ${ item.type === 'video' ? html`
            <div class="video-container">
              <paper-button @click="${this._renderVideo.bind(this)}" .item="${item}" >
                <storix-icon class="video-camera-icon" icon="video-camera"></storix-icon>
              </paper-button>
            </div>
          ` : '' }
        </li>
      `;
    }

  }
}

customElements.define('storix-photos', StorixPhotos);
