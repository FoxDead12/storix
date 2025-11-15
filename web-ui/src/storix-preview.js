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
      max-height: 100vw;
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
    }

  `;

  static properties = {
    item: {
      typeof: Object
    }
  }

  constructor () {
    super();
  }

  render () {
    return html`
      <dialog id="dialog">

        <div class="actions-preview">
          <paper-button>
            <storix-icon icon="arrow-left" ></storix-icon>
          </paper-button>
          <paper-button>
            <storix-icon icon="arrow-right" ></storix-icon>
          </paper-button>
        </div>

        <div id="content-container">
          <img class="thumbnail" src="/fs/files/${this.item.uuid}?filter[thumbnail]=true" @load=${this._imageLoad.bind(this)} />
        </div>

      </dialog>
    `
  }

  firstUpdated () {
    this.dialog = this.shadowRoot.getElementById('dialog');
    this.contentContainer = this.shadowRoot.getElementById('content-container');
    this.dialog.showModal();

    this.dialog.addEventListener('cancel', (e) => {
      this.close();
    });
  }

  close () {
    this.remove();
  }

  _imageLoad (e) {

    // ... parse data from event ...
    const img = e.currentTarget;
    const src = img.src;

    if ( src && src.endsWith('filter[thumbnail]=true') ) {

      if ( this.item.type === 'image' ) {
        img.classList.remove('thumbnail');
        return img.setAttribute('src', `/fs/files/${this.item.uuid}`);
      }

      if ( this.item.type === 'video' ) {
        return render(html`<video src="fs/files/${this.item.uuid}" controls hidden @loadedmetadata=${this._videoLoad.bind(this)}></video>`, this.contentContainer);
      }

    }

  }

  _videoLoad (e) {
    const video = e.currentTarget;
    e.currentTarget.parentElement.querySelector('img').remove();
    video.removeAttribute('hidden');
    console.log("remove")
  }

}

customElements.define('storix-preview', StorixPreview);
