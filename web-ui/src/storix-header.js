import { html, LitElement, css } from "lit";
import '../components/storix-icon.js';
import '@polymer/paper-button/paper-button.js';

export default class StorixHeader extends LitElement {

  static styles = css`
    :host {
      box-shadow:
        0 1px 1px hsl(0deg 0% 0% / 0.075),
        0 2px 2px hsl(0deg 0% 0% / 0.075),
        0 4px 4px hsl(0deg 0% 0% / 0.075),
        0 8px 8px hsl(0deg 0% 0% / 0.075);
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: var(--primary-color);
      color: #fff;
      padding: 0px 24px;
    }

    h5 {
      padding: 0px;
      margin: 0px;
      font-weight: bold;
      font-size: 24px;
      font-family: 'Poppins', sans-serif;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    ul {
      padding: 0px;
      margin: 0px;
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .menu-list > paper-button {
      min-width: 0 !important;
      padding: 0px;
      margin: 0px;
      border-radius: 50%;
      aspect-ratio: 1 / 1;
    }

    .menu-list > paper-button[disabled] {
      opacity: 0.5;
    }

    .navigation-list {
      list-style: none;
      padding: 0px;
      margin: 0px;
      gap: 0px;
    }

    .navigation-list li {
      padding: 18px;
      min-width: 60px;
      text-align: center;
      cursor: pointer;
    }

    .navigation-list li:hover {
      background-color: #fff;
      color: var(--primary-color);
    }
  `;

  static properties = {
    disabeldShare: {
      typeof: Boolean
    },
    disabledDelete: {
      typeof: Boolean
    },
    disabledDownload: {
      typeof: Boolean
    }
  }

  constructor () {
    super();
    this.disabeldShare = true;
    this.disabledDelete = true;
    this.disabledDownload = true;
  }

  render () {
    return html`
      <header>

        <h5>Storix.</h5>

        <ul class="navigation-list">
          <li @click=${() => app.changeRoute('/gallery')} >Gallery</li>
          <li @click=${() => app.changeRoute('/files')} >Files</li>
        </ul>

        <ul class="menu-list">
          <paper-button>
            <storix-icon icon="plus" @click=${this._openWizardUpload.bind(this)}></storix-icon>
          </paper-button>
          <paper-button ?disabled=${this.disabledDownload} @click=${this._downloadFiles.bind(this)}>
            <storix-icon icon="download"></storix-icon>
          </paper-button>
          <paper-button ?disabled=${this.disabeldShare}>
            <storix-icon icon="share"></storix-icon>
          </paper-button>
          <paper-button ?disabled=${this.disabledDelete} @click=${this._openDeleteFilesWizard.bind(this)}>
            <storix-icon icon="trash"></storix-icon>
          </paper-button>
        </ul>

      </header>
    `;
  }

  firstUpdated () {
    window.addEventListener('selected-items-changed', this._currentPageChangeSelectedItems.bind(this))
    window.addEventListener('route-changed', this._appChangeRoute.bind(this))
  }

  // ... method fire in event when user select multi items in pages ...
  _currentPageChangeSelectedItems (e) {
    const page = app.currentPage;
    const selectedItems = page.selectedItems;

    if ( selectedItems.length > 0 ) {
      this.disabeldShare = false;
      this.disabledDelete = false;
      this.disabledDownload = false;
    } else {
      this.disabeldShare = true;
      this.disabledDelete = true;
      this.disabledDownload = true;
    }
  }

  // ... method fire in event when app change route ...
  _appChangeRoute (e) {
    this.disabeldShare = true;
    this.disabledDelete = true;
    this.disabledDownload = true;
  }

  _openWizardUpload () {
    app.openDialog({
      mode: 'no-footer',
      title: 'Upload your files',
      pages: ['storix-upload-files']
    });
  }

  // ... open wizard to delete selected files ...
  async _openDeleteFilesWizard () {
    const items = app.currentPage.selectedItems;
    await app.openDialog({
      items: items,
      title: 'Delete Files',
      pages: ['storix-delete-files']
    });
    app.currentPage.selectedItems = new Array();
  }

  // ... download action, will download a zip file ...
  async _downloadFiles () {
    const items = app.currentPage.selectedItems;
    const uuids = new Array();
    for ( const item of items ) {
      uuids.push(item.uuid);
    }

    const file = await fetch('../fs/download', { method: 'POST', body: JSON.stringify({items: uuids}) });
    const blob = await file.blob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "download.zip";
    a.click();
    URL.revokeObjectURL(url);

    app.currentPage.selectedItems = new Array();
  }

}

customElements.define('storix-header', StorixHeader);
