import { html, LitElement, css, render } from "lit";
import { repeat } from 'lit/directives/repeat.js';
import '../components/storix-icon.js';
import StorixText from "../modules/storix-text.js";

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
      gap: 0.5rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
      grid-auto-rows: 55px;
      overflow-y: auto;
      scrollbar-width: none;
    }

    ul::-webkit-scrollbar {
      display: none;
    }

    ul > li {
      position: relative;
      grid-column: span 3;
      grid-row: span 4;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border-radius: 5px;
      overflow: hidden;
    }

    .image-container {
      box-shadow:
        0 1px 1px hsl(0deg 0% 0% / 0.075),
        0 2px 2px hsl(0deg 0% 0% / 0.075),
        0 4px 4px hsl(0deg 0% 0% / 0.075),
        0 8px 8px hsl(0deg 0% 0% / 0.075),
        0 16px 16px hsl(0deg 0% 0% / 0.075);
      background-color: #ccc;
      cursor: pointer;
    }

    .image-container::before {
      content: '';
      position: absolute;
      top: 0px;
      left: 0px;
      height: 100%;
      width: 100%;
    }

    .image-container:hover::before {
      background-color: rgba(0, 0, 0, 0.2);
    }

    ul > .separator {
      grid-column: 1/-1;
      grid-row: span 1;
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
      margin: 0;
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


    .month-title {
      font-size: 28px;
      font-weight: normal;
      padding: 0px;
      margin: 0;
      padding-top: 20px;
    }

    .day-title {
      font-size: 18px;
      font-weight: normal;
      padding: 0px;
      margin: 0;
      padding-top: 12px;
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
      this.fetchPhotos();
    }
  }

  async fetchPhotos () {

    const result = await app.broker.get('files?filter[p_photos]=true&page=' + this.page);
    const newItems = []

    // ... generate separators ...
    for ( const item of result.response ) {

      const date_day = item.birthtime_date;
      const date_month = item.birthtime_date.slice(0, 7);

      if ( this.currentMonth != date_month ) {
        this.currentMonth = date_month;
        const separator = { separator: true, month: date_month };
        newItems.push(separator);
      }


      if ( this.currentDay != date_day ) {
        this.currentDay = date_day;
        const separator = { separator: true, day: date_day };
        newItems.push(separator);
      }

      newItems.push(item);
    }

    // ... force lit to render all images ...
    this.items.push(...newItems);
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

  _onImageLoad (e) {

    const img = e.currentTarget;
    const parent = img.parentElement;

    const isLandscape = img.width > img.height;

    img.style.width = '100%';
    img.style.height = '100%';

    if (isLandscape) {
      parent.setAttribute('style', 'grid-column: span 6; grid-row: span 4;');
    } else {
      parent.setAttribute('style', 'grid-column: span 3; grid-row: span 4;');
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

  _showRealImage (e) {

    console.log(e.currentTarget);
    const item = e.currentTarget.item;
    const container = document.createElement('div');
    const image = document.createElement('img');

    container.setAttribute('style', `position: fixed; z-index: 1000; background: #333; width: 100%; height: 100%; top: 0px; left: 0px;`);
    image.src = `/fs/files/${item.uuid}`
    image.setAttribute('style', 'width: 600px;')

    container.append(image);
    document.body.append(container);

  }

  _renderVideo (e) {
    const item = e.currentTarget.item;
    const element = document.createElement('video');

    element.setAttribute('src', `fs/files/${item.uuid}`);
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
      const month_date = item.month ? new Date(item.month) : null;
      const day_date   = item.day ? new Date(item.day) : null;
      return html`
        <li class="separator">
          ${ month_date ? html`<p class="month-title">${StorixText.months[month_date.getMonth()]} ${month_date.getFullYear()}</p>` : '' }
          ${ day_date   ? html`<p class="day-title">${StorixText.days[day_date.getDay()]}, ${day_date.getDate().toString().padStart(2, 0)}/${(day_date.getMonth() + 1).toString().padStart(2, 0)}</p>` : '' }
        </li>
      `;
    } else {
      return html`
        <li class="image-container" @click=${this._showRealImage.bind(this)} .item=${item} >
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
