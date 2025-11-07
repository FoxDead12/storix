import { html, css } from "lit";
import { repeat } from 'lit/directives/repeat.js';
import StorixDialogPage from "../components/storix-dialog/storix-dialog-page.js";
import '../components/storix-icon.js'
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-progress/paper-progress.js';

export default class StorixUploadFiles extends StorixDialogPage {

  static styles = css`
    :host {
      width: 100%;
      height: 100%;
      display: flex;
    }

    .dropzone {
      width: 100%;
      border: 2px dashed #ccc;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
    }

    .dropzone > storix-icon {
      color: #ccc;
      width: 128px;
      height: 128px;
      --icon-stroke-width: 0.5;
    }

    .dropzone > h5 {
      font-weight: normal;
      font-size: 24px;
      padding: 0px;
      margin: 0px;
      color: #ccc;
    }

    .dropzone > p {
      padding: 0px;
      margin: 0px;
      color: #ccc;
    }

    .dropzone > paper-button {
      background-color: var(--primary-color);
      font-weight: normal;
      color: #fff;
    }

    .dropzone.dragover {
      border-color: #007bff;
      background: #f0f8ff;
    }

    .dropzone.dragover > h5,
    .dropzone.dragover > p,
    .dropzone.dragover > storix-icon {
      color: #007bff;
    }

    .dropzone > ul {
      margin: 0px;
      padding: 0px;
      width: 100%;
      height: 100%;
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      overflow: auto;
    }

    .dropzone > ul > li {
      width: 30%;
      flex-grow: 1;
    }

    .dropzone > ul > li > p {
      margin: 0px;
      padding: 0px;
      margin-bottom: 8px;
      overflow: hidden;
      text-wrap: nowrap;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .dropzone > ul > li > paper-progress {
      width: 100%;
      --paper-progress-active-color: var(--primary-color);
    }

    .dropzone > ul > li.success > p,
    .dropzone > ul > li.success > paper-progress  {
      color: green;
      --paper-progress-active-color: green;
    }

    .dropzone > ul > li.error > p,
    .dropzone > ul > li.error > paper-progress  {
      color: red;
      --paper-progress-active-color: red;
    }

  `;

  static properties = {
    files: {
      typeof: Array
    }
  }

  constructor () {
    super();
    this.files = new Array();
  }

  render() {
    return html`
      <div id="dropzone" class="dropzone" @dragover=${this._dropzoneDragOver.bind(this)} @dragleave=${this._dropzoneDragLeave.bind(this)} @drop=${this._dropzoneDragDrop.bind(this)} style="max-height: ${this.clientHeight}px;">

        ${ this.files.length === 0
          ? html`
            <storix-icon icon="cloud-arrow-up"></storix-icon>
            <h5>Drag&Drop files here</h5>
            <p>or</p>
          `
          : html`
            <ul class="files-list" id="files-list" >
              ${repeat(this.files, (file) => file.id, this.renderFile.bind(this))}
            </ul>
          `
        }

        <paper-button id="search-files" @click=${this._openInputFile.bind(this)}>Browser Files</paper-button>
        <input type="file" id="file"  multiple @change=${this._filesUpload.bind(this)}/>

      </div>
    `;
  }

  firstUpdated () {
    this.dropzone  = this.shadowRoot.getElementById('dropzone');
    this.inputFile = this.shadowRoot.getElementById('file');
  }

  enter () {
    this.dialog.changeNextButtonToText('Close');
  }

  save () {
    this.dialog.close();
  }

  _dropzoneDragOver (e) {
    e.preventDefault();
    this.dropzone.classList.add('dragover');
  }

  _dropzoneDragLeave (e) {
    e.preventDefault();
    this.dropzone.classList.remove('dragover');
  }

  _dropzoneDragDrop (e) {
    e.preventDefault();
    this.dropzone.classList.remove('dragover');
    this._filesUpload(e);
  }

  _openInputFile (e) {
    e.preventDefault();
    e.stopPropagation();
    this.inputFile.click();
  }

  _filesUpload (e) {

    const files = e.target.files || e.dataTransfer.files
    for (const file of files ) {
      file.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
      this._upload(file);
      this.files = [...this.files ,file];
    }

  }

  _upload (file) {
    let progress = 0;
    const xhr = new XMLHttpRequest();

    const uploadUrl = new URL('/fs/upload', window.origin);
    uploadUrl.searchParams.append('file_name', file.name);
    uploadUrl.searchParams.append('directory', 0);

    xhr.open('POST', uploadUrl);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.upload.progress = (e) => {
      if (e.lengthComputable) {
        progress = Math.round((e.loaded / e.total) * 100);
        this.shadowRoot.getElementById(file.id.toString()).querySelector('paper-progress').value = progress;
      }
    }

    xhr.onload = () => {
      if ( xhr.status == 200 ) {
        this.shadowRoot.getElementById(file.id.toString()).querySelector('paper-progress').value = 100;
        this.shadowRoot.getElementById(file.id.toString()).classList.add("success");
      } else {
        this.shadowRoot.getElementById(file.id.toString()).classList.add("error");
      }
    };

    xhr.onerror = () => {
      console.log("erro");
      this.shadowRoot.getElementById(file.id.toString()).classList.add("error");
    };

    xhr.onabort = () => {
      console.log("ficheiro abortado");
      this.shadowRoot.getElementById(file.id.toString()).classList.add("error");
    };

    xhr.send(file);
  }

  // -------------------------------------------------------------------- //
  // RENDER METHODS
  // -------------------------------------------------------------------- //

  renderFile (file) {
    return html`
      <li id="${file.id}">
        <p>${file.name}</p>
        <paper-progress value="0"></paper-progress>
      </li>
    `
  }
}

customElements.define('storix-upload-files', StorixUploadFiles);
