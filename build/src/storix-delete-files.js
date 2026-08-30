import { i, x } from '../lit-element-build.js';
import { S as StorixDialogPage } from '../paper-progress-build.js';
import '../polymer-legacy-build.js';
import '../iron-flex-layout-build.js';
import '../color-build.js';

class StorixDeleteFiles extends StorixDialogPage {

  static styles = i`
    :host {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .warning-info {
      color: #004085;
      background-color: #cce5ff;
      border-color: #b8daff;
      border-radius: var(--radius-sm);
      padding: var(--space-3);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .warning-info > p,
    .warning-info > h5 {
      padding: 0px;
      margin: 0px;
    }

    .progress-text-container {
      display: flex;
      justify-content: space-between;
    }

    paper-progress {
      width: 100%;
      --paper-progress-height: 24px;
      --paper-progress-active-color: var(--primary-color);
      border-radius: 24px;
    }
  `;

  static properties = {
    items: {
      typeof: Array
    },
    _currentPosition: {
      typeof: Number
    },
    _progressMessage: {
      typeof: Text
    },
    _errors: {
      typeof: Array
    }
  }

  constructor () {
    super();
    this.items = new Array();
    this._errors = new Array();
    this._currentPosition = 0;
    this._progressMessage = 'Waiting for execution ...';
  }

  render () {
    return x`
      <div class="warning-info">
        <h5><b>Warning</b></h5>
        <p>This action is irreversible. The files that will be deleted cannot be recovered. If you want to cancel, close the wizard; otherwise, click the ‘Delete’ button.</p>
      </div>

      <div>
        <div class="progress-text-container">
          <p>${this._progressMessage}</p>
          <p>${this._currentPosition}/${this.items.length}</p>
        </div>
        <paper-progress id="progress" value="0"></paper-progress>
      </div>
    `;
  }

  firstUpdated () {
    this.items = this.dialog.options.items;
    this.progressBar = this.shadowRoot.getElementById('progress');
  }

  enter () {
    this.dialog.changeNextButtonToText('Delete');
  }

  async save () {
    const progressAmout = 100 / this.items.length;
    this._progressMessage = 'Deleting files ...';

    for (const item of this.items) {
      await this.deleteItem(item);
      this._currentPosition += 1;
      this.progressBar.value = progressAmout * this._currentPosition;
      app.removeItem(item);
    }

    this.dialog.close();

  }

  async deleteItem (item) {
    try {
      await app.broker.delete('files?uuid=' + item.uuid);
    } catch (e) {
      console.error(e);
    }
  }

}

customElements.define('storix-delete-files', StorixDeleteFiles);

export { StorixDeleteFiles as default };
