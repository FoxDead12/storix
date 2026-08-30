import { html, css } from "lit";
import { repeat } from 'lit/directives/repeat.js';
import StorixDialogPage from "../components/storix-dialog/storix-dialog-page.js";
import '../components/storix-icon.js'
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-progress/paper-progress.js';

export default class StorixUploadFiles extends StorixDialogPage {

  static MAX_CONCURRENT_UPLOADS = 5;

  static styles = css`
    :host {
      width: 100%;
      height: 100%;
      min-height: 0;
      display: flex;
    }

    .dropzone {
      width: 100%;
      height: 100%;
      min-height: 0;
      border: 2px dashed var(--border-color);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4);
      box-sizing: border-box;
      transition: 150ms ease-in-out border-color, 150ms ease-in-out background-color;
    }

    .empty-state {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: var(--space-3);
    }

    .empty-state > storix-icon {
      --icon-width: 112px;
      --icon-height: 112px;
      --icon-fill: #d2d2d7;
    }

    .empty-state > h5 {
      font-weight: 500;
      font-size: 22px;
      padding: 0px;
      margin: 0px;
      color: var(--text-color-muted);
    }

    .empty-state > p {
      padding: 0px;
      margin: 0px;
      color: var(--text-color-muted);
    }

    .dropzone paper-button {
      background-color: var(--primary-color);
      font-weight: normal;
      color: #fff;
      border-radius: var(--radius-sm);
    }

    .dropzone paper-button.text-button {
      background-color: transparent;
      color: var(--primary-color);
    }

    .dropzone.dragover {
      border-color: var(--primary-color);
      background: var(--primary-color-10);
    }

    .dropzone.dragover .empty-state > h5,
    .dropzone.dragover .empty-state > p {
      color: var(--primary-color);
    }

    .dropzone.dragover .empty-state > storix-icon {
      --icon-fill: var(--primary-color-30);
    }

    .uploading-header {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .uploading-header > p {
      color: var(--text-color-muted);
      font-size: 14px;
    }

    ul.files-list {
      flex: 1 1 auto;
      min-height: 0;
      margin: 0px;
      padding: 0px var(--space-1) 0px 0px;
      width: 100%;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      overflow-y: auto;
    }

    ul.files-list > li {
      /* width: 100%; */
      flex: 0 0 auto;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
    }

    ul.files-list > li > p {
      margin: 0px;
      padding: 0px;
      margin-bottom: var(--space-2);
      overflow: hidden;
      text-wrap: nowrap;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 14px;
    }

    ul.files-list > li > paper-progress {
      width: 100%;
      --paper-progress-active-color: var(--primary-color);
    }

    ul.files-list > li.success > p,
    ul.files-list > li.success > paper-progress  {
      color: green;
      --paper-progress-active-color: green;
    }

    ul.files-list > li.error > p,
    ul.files-list > li.error > paper-progress  {
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
      <div id="dropzone" class="dropzone" @dragover=${this._dropzoneDragOver.bind(this)} @dragleave=${this._dropzoneDragLeave.bind(this)} @drop=${this._dropzoneDragDrop.bind(this)}>

        ${ this.files.length === 0
          ? html`
            <div class="empty-state">
              <storix-icon icon="cloud-arrow-up"></storix-icon>
              <h5>Drag&Drop files here</h5>
              <p>or</p>
              <label for="file">
                <paper-button id="search-files">Browse Files</paper-button>
              </label>
            </div>
          `
          : html`
            <div class="uploading-header">
              <p>${this.files.length} file${this.files.length === 1 ? '' : 's'}</p>
              <label for="file">
                <paper-button class="text-button">Add more</paper-button>
              </label>
            </div>
            <ul class="files-list" id="files-list" >
              ${repeat(this.files, (file) => file.id, this.renderFile.bind(this))}
            </ul>
          `
        }

        <input type="file" id="file" hidden multiple @change=${this._filesUpload.bind(this)}/>

      </div>
    `;
  }

  firstUpdated () {
    this.dropzone  = this.shadowRoot.getElementById('dropzone');
    this.inputFile = this.shadowRoot.getElementById('file');
    this.button = this.shadowRoot.getElementById('search-files');
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
    this.inputFile.click();
    this.inputFile.pointerenter();
  }

  async _filesUpload (e) {
    const files = Array.from(e.target.files || e.dataTransfer.files);
    for (const file of files ) {
      file.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
      this.files = [...this.files ,file];
    }
    // reset the input so selecting the same file(s) again later still fires 'change'
    this.inputFile.value = '';

    // bounded-concurrency pool: at most MAX_CONCURRENT_UPLOADS in flight at once, so a
    // batch of many files doesn't upload one-by-one nor all-at-once
    let index = 0;
    const worker = async () => {
      while (index < files.length) {
        const file = files[index++];
        await this._upload(file); // never rejects: one file failing must not stop the others
      }
    };
    const workers = Array.from({ length: Math.min(StorixUploadFiles.MAX_CONCURRENT_UPLOADS, files.length) }, worker);
    await Promise.all(workers);
  }

  async _upload (file, _retried = false) {
    try {
      await new Promise((res, rej) => {
        const uploadUrl = new URL('/api/upload', window.origin);
        uploadUrl.searchParams.append('file_name', file.name);
        uploadUrl.searchParams.append('directory', 0);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.withCredentials = true;

        xhr.upload.onprogress = (e) => {
          const progress = Math.round((e.loaded / e.total) * 100);
          this.shadowRoot.getElementById(file.id.toString()).querySelector('paper-progress').value = progress;
          this.shadowRoot.getElementById(file.id.toString()).querySelector('paper-progress').indeterminate = false;
        }

        xhr.onload = () => {
          if ( xhr.status == 200 ) {
            this.shadowRoot.getElementById(file.id.toString()).querySelector('paper-progress').value = 100;
            this.shadowRoot.getElementById(file.id.toString()).querySelector('paper-progress').indeterminate = false;
            this.shadowRoot.getElementById(file.id.toString()).classList.add("success");
            res();
          } else if (xhr.status === 401) {
            rej({ type: 'unauthorized' });
          } else {
            rej({ type: 'error', message: xhr.statusText || `Upload failed (${xhr.status})` });
          }
        };

        xhr.onerror = () => rej({ type: 'error', message: 'Network error while uploading' });
        xhr.onabort = () => rej({ type: 'error', message: 'Upload aborted' });

        xhr.send(file);
      });
    } catch (err) {
      // access token expired mid-batch: refresh once (shared across concurrent uploads
      // via storix-broker's refreshPromise) and retry this same file before giving up
      if (err?.type === 'unauthorized' && !_retried) {
        try {
          await app.broker.refreshSession();
          return await this._upload(file, true);
        } catch (refreshErr) {
          // refresh failed too (no valid refresh token left): treat as a real auth failure
        }
      }

      this.shadowRoot.getElementById(file.id.toString()).classList.add("error");
      app.toast.openToast({ message: err?.message || `Failed to upload ${file.name}`, status: 'error' });
    }
  }

  // -------------------------------------------------------------------- //
  // RENDER METHODS
  // -------------------------------------------------------------------- //

  renderFile (file) {
    return html`
      <li id="${file.id}">
        <p>${file.name}</p>
        <paper-progress value="0" indeterminate></paper-progress>
      </li>
    `
  }
}

customElements.define('storix-upload-files', StorixUploadFiles);
