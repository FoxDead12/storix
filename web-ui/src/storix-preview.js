import { css, html, LitElement, render } from "lit";
import '@polymer/paper-button/paper-button.js';
import '../components/storix-icon.js';
import StorixText from "../modules/storix-text.js";

export default class StorixPreview extends LitElement {

  static styles = css`

    dialog {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      margin: 0;
      border: none;
      border-radius: 0;
      padding: 0;
      z-index: 10000;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      outline: none;
    }

    dialog:modal {
      max-width: 100vw;
      max-height: 100vh;
    }

    #content-container {
      position: relative;
      width: 100%;
      height: 100%;
    }

    img,
    video {
      position: absolute;
      inset: 0;
      object-fit: contain;
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: 200ms ease-in-out opacity;
    }

    img.ready,
    video.ready {
      opacity: 1;
    }

    iframe {
      position: relative;
      object-fit: contain;
      width: 100vw;
      height: 100vh;
      z-index: 1;
      border: none;
    }

    .chrome {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      pointer-events: none;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0) 15%, rgba(0, 0, 0, 0) 80%, rgba(0, 0, 0, 0.55) 100%);
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-3) var(--space-4);
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-width: 0;
    }

    .meta {
      min-width: 0;
      display: flex;
      flex-direction: column;
      color: #fff;
    }

    .meta > .filename {
      font-size: 15px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: min(60vw, 480px);
    }

    .meta > .filedate {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.75);
    }

    .nav-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-4);
    }

    .bottombar {
      display: flex;
      justify-content: center;
      padding: var(--space-3) var(--space-4);
    }

    .counter {
      pointer-events: auto;
      color: rgba(255, 255, 255, 0.85);
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.35);
    }

    paper-button.icon-btn {
      color: #fff;
      width: 44px;
      height: 44px;
      min-width: 0px !important;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, 0.45);
      z-index: 10;
      pointer-events: auto;
      transition: 150ms ease-in-out background-color;
    }

    paper-button.icon-btn:hover {
      background-color: rgba(0, 0, 0, 0.7);
    }

    paper-button.nav-btn {
      color: #fff;
      width: 50px;
      height: 50px;
      min-width: 0px !important;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, 0.45);
      z-index: 10;
      pointer-events: auto;
      transition: 150ms ease-in-out background-color;
    }

    paper-button.nav-btn:hover {
      background-color: rgba(0, 0, 0, 0.7);
    }

    paper-button.nav-btn[disabled] {
      opacity: 0;
      pointer-events: none;
    }

    .spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 40px;
      height: 40px;
      margin: -20px 0 0 -20px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.25);
      border-top-color: #fff;
      animation: spin 800ms linear infinite;
      opacity: 0;
      transition: 150ms ease-in-out opacity;
    }

    .spinner.visible {
      opacity: 1;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

  `;

  static properties = {
    item: {
      typeof: Object
    },
    type: {
      typeof: String
    },
    _renderImage: {
      typeof: Boolean
    },
    _renderVideo: {
      typeof: Boolean
    },
    _loading: {
      typeof: Boolean
    },
    _hasNext: {
      typeof: Boolean
    },
    _hasPrevious: {
      typeof: Boolean
    }
  }

  constructor () {
    super();
    this._resetStates();
  }

  render () {
    return html`
      <dialog id="dialog">

        <div id="content-container">
          ${ this.type == 'photos'
            ? html`
              ${ this._renderImage == true ? html`<img class="thumbnail ${this._loading ? '' : 'ready'}" src="/api/download?uuid=${this.item.uuid}&filter[thumbnail]=true" @load=${this._imageLoad.bind(this)} />` : '' }
              ${ this._renderVideo == true ? html`<video class="ready" preload="metadata" playsinline webkit-playsinline controls poster="/api/download?uuid=${this.item.uuid}&filter[thumbnail]=true" src="/api/download?uuid=${this.item.uuid}" @loadedmetadata=${this._videoLoad.bind(this)}></video>` : '' }
              `
            : html`
              <iframe src="/api/download?uuid=${this.item.uuid}" width="100%" height="600"></iframe>
            `
          }
        </div>

        <div class="spinner ${this._loading ? 'visible' : ''}"></div>

        <div class="chrome">

          <div class="topbar">
            <div class="topbar-left">
              <paper-button class="icon-btn" @click=${this.close.bind(this)}><storix-icon icon="x-mark"></storix-icon></paper-button>
              <div class="meta">
                <p class="filename">${this.item.description || ''}</p>
                <p class="filedate">${this._formattedDate()}</p>
              </div>
            </div>
            <paper-button class="icon-btn" @click=${this._download.bind(this)}><storix-icon icon="download"></storix-icon></paper-button>
          </div>

          <div class="nav-row">
            <paper-button class="nav-btn" ?disabled=${!this._hasPrevious} @click=${this.buttonPrevious.bind(this)}><storix-icon icon="arrow-left"></storix-icon></paper-button>
            <paper-button class="nav-btn" ?disabled=${!this._hasNext} @click=${this.buttonNext.bind(this)}><storix-icon icon="arrow-right"></storix-icon></paper-button>
          </div>

          <div class="bottombar">
            <span class="counter">${this._counterLabel()}</span>
          </div>

        </div>

      </dialog>
    `
  }

  firstUpdated () {
    // ... get elements of DOM ...
    this.dialog = this.shadowRoot.getElementById('dialog');
    this.contentContainer = this.shadowRoot.getElementById('content-container');

    // ... event lister when cancel dialog 'ESC' ...
    this.dialog.addEventListener('cancel', (e) => this.close());

    // ... keyboard navigation: left/right to move between items ...
    this._onKeydown = this._onKeydown.bind(this);
    window.addEventListener('keydown', this._onKeydown);

    // ... show dialog "open" ...
    this.dialog.showModal();
    this._updateNavState();
  }

  disconnectedCallback () {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._onKeydown);
  }

  _onKeydown (e) {
    if ( e.key === 'ArrowRight' ) this.buttonNext();
    if ( e.key === 'ArrowLeft' ) this.buttonPrevious();
    if ( e.key === 'Escape' ) this.close();
  }

  close () {
    this.remove();
  }

  _resetStates () {
    this._renderImage = true;
    this._renderVideo = false;
    this._loading = true;
  }

  _formattedDate () {
    if ( !this.item || !this.item.birthtime_date ) return '';
    const date = new Date(this.item.birthtime_date);
    if ( Number.isNaN(date.getTime()) ) return '';
    return `${StorixText.days[date.getDay()]}, ${date.getDate().toString().padStart(2, 0)} ${StorixText.months[date.getMonth()]} ${date.getFullYear()}`;
  }

  _counterLabel () {
    if ( !app.photos || !this.item ) return '';

    const total = app.photosTotal || app.photos.filter((it) => !it.separator).length;
    const currentIndex = app.photos.findIndex((it) => it.uuid === this.item.uuid);
    if ( currentIndex === -1 ) return '';

    const position = app.photos.slice(0, currentIndex + 1).filter((it) => !it.separator).length;

    return `${position} / ${total}`;
  }

  _download (e) {
    const a = document.createElement("a");
    a.href = `/api/download?uuid=${this.item.uuid}`;
    a.download = this.item.description || this.item.uuid;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  _imageLoad (e) {

    // ... parse data from event ...
    const img = e.currentTarget;
    const src = img.src;

    // ... thumbails was loaded ...
    if ( src && src.endsWith('filter[thumbnail]=true') ) {
      if ( this.item.type === 'image' ) {
        img.classList.remove('thumbnail');
        img.setAttribute('src', `/api/download?uuid=${this.item.uuid}`);
        return;
      }
      if ( this.item.type === 'video' ) {
        // ... the <video> below has its own poster="" pointing at this same
        // thumbnail, and is shown immediately (not gated on loadedmetadata):
        // mobile browsers won't preload a hidden/invisible <video>, and won't
        // fire loadedmetadata without a user tap, which would otherwise
        // deadlock - hidden until loaded, loaded only once tapped, but never
        // tappable while hidden ...
        this._renderVideo = true;
        this._loading = false;
        return;
      }
    }

    // ... full resolution image finished loading ...
    this._loading = false;

  }

  _videoLoad (e) {
    // ... metadata is in, the <video>'s own frame/poster is showing: drop the
    // now-redundant <img> underneath ...
    this._renderImage = false;
  }

  _updateNavState () {

    if ( !app.photos || !this.item ) {
      this._hasNext = false;
      this._hasPrevious = false;
      return;
    }

    const currentIndex = app.photos.findIndex((it) => it.uuid === this.item.uuid);

    this._hasNext = this._findAdjacentIndex(currentIndex, 1) !== -1;
    this._hasPrevious = this._findAdjacentIndex(currentIndex, -1) !== -1;

  }

  _findAdjacentIndex (fromIndex, direction) {

    let index = fromIndex + direction;
    while ( app.photos[index] ) {
      if ( app.photos[index].separator !== true && app.photos[index].placeholder !== true ) return index;
      index += direction;
    }

    return -1;

  }

  buttonNext (e) {
    if ( !app.photos ) return;

    const currentIndex = app.photos.findIndex(item => item.uuid === this.item.uuid);
    const nextIndex = this._findAdjacentIndex(currentIndex, 1);
    if ( nextIndex === -1 ) return;

    this._resetStates();
    this.item = app.photos[nextIndex];
    this._updateNavState();
  }

  buttonPrevious () {
    if ( !app.photos ) return;

    const currentIndex = app.photos.findIndex(item => item.uuid === this.item.uuid);
    const previousIndex = this._findAdjacentIndex(currentIndex, -1);
    if ( previousIndex === -1 ) return;

    this._resetStates();
    this.item = app.photos[previousIndex];
    this._updateNavState();
  }

}

customElements.define('storix-preview', StorixPreview);
