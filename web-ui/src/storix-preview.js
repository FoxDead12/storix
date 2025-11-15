import { css, html, LitElement, render } from "lit";
import '@polymer/paper-button/paper-button.js';
import '../components/storix-icon.js';

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

    img {
      object-fit: contain;
      width: 100vw;
      height: 100vh;
    }

    video {
      object-fit: contain;
      max-width: 100vw;
      height: 100vh;
    }

    .actions-preview {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    paper-button {
      color: #fff;
      width: 50px;
      height: 50px;
      min-width: 0px !important;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, .7);
      margin: 0px 24px;
      z-index: 10;
    }

  `;

  static properties = {
    item: {
      typeof: Object
    },
    _renderImage: {
      typeof: Boolean
    },
    _renderVideo: {
      typeof: Boolean
    },
    _hideVideo: {
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

        <div class="actions-preview">
          <paper-button @click=${this.buttonPrevious.bind(this)}><storix-icon icon="arrow-left" ></storix-icon></paper-button>
          <paper-button @click=${this.buttonNext.bind(this)} ><storix-icon icon="arrow-right" ></storix-icon></paper-button>
        </div>

        <div id="content-container">
          ${ this._renderImage == true ? html`<img class="thumbnail" src="/fs/files/${this.item.uuid}?filter[thumbnail]=true" @load=${this._imageLoad.bind(this)} />` : '' }
          ${ this._renderVideo == true ? html`<video src="/fs/files/${this.item.uuid}" controls ?hidden=${this._hideVideo} @loadedmetadata=${this._videoLoad.bind(this)}></video>` : '' }
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

    // ... show dialog "open" ...
    this.dialog.showModal();
  }

  close () {
    this.remove();
  }

  _resetStates () {
    this._renderImage = true;
    this._renderVideo = false;
    this._hideVideo = true;
  }

  _imageLoad (e) {

    // ... parse data from event ...
    const img = e.currentTarget;
    const src = img.src;

    // ... thumbails was loaded ...
    if ( src && src.endsWith('filter[thumbnail]=true') ) {
      if ( this.item.type === 'image' ) {
        img.classList.remove('thumbnail');
        img.setAttribute('src', `/fs/files/${this.item.uuid}`);
        return;
      }
      if ( this.item.type === 'video' ) {
        this._renderVideo = true;
      }
    }

  }

  _videoLoad (e) {
    this._renderImage = false;
    this._hideVideo = false;
  }

  buttonNext (e) {
    if ( !app.photos ) return;
    this._resetStates();

    let next_item_found = false;
    let item = null;
    let index_current_item = app.photos.findIndex(item => item.uuid === this.item.uuid);

    index_current_item += 1;
    do {
      item = app.photos[index_current_item];
      if (!item) return;

      if ( item.separator === true ) {
        next_item_found = false;
        index_current_item += 1;
      } else {
        next_item_found = true;
      }
    } while (next_item_found == false);

    this.item = item;
  }

  buttonPrevious () {
    if ( !app.photos ) return;
    this._resetStates();

    let next_item_found = false;
    let item = null;
    let index_current_item = app.photos.findIndex(item => item.uuid === this.item.uuid);

    index_current_item -= 1;
    do {
      item = app.photos[index_current_item];
      if (!item) return;

      if ( item.separator === true ) {
        next_item_found = false;
        index_current_item -= 1;
      } else {
        next_item_found = true;
      }
    } while (next_item_found == false);

    this.item = item;
  }

}

customElements.define('storix-preview', StorixPreview);
