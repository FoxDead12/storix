import { css, html, LitElement, render } from "lit";

export default class StorixPreview extends LitElement {

  static styles = css`

    dialog::backdrop {
      content: "";
      position: fixed;
      inset: 0px;
      background: rgba(0, 0, 0, .4);
      backdrop-filter: blur(5px);
    }

    dialog {
      background-color: transparent;
      border: none;
      object-fit: cover;
      outline: none;
    }

    img {
      object-fit: contain;
      width: 1000px;
      max-height: 1000px
    }

    video {
      object-fit: contain;
      max-width: 1000px;
      max-height: 1000px
    }

    .thumbnail {
      width: 1000px;
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
