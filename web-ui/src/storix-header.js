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
      padding: 12px 24px;
    }

    h5 {
      padding: 0px;
      margin: 0px;
      font-weight: bold;
      font-size: 24px;
      font-family: 'Poppins';
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

    paper-button {
      min-width: 0 !important;
      padding: 0px;
      margin: 0px;
      border-radius: 50%;
      aspect-ratio: 1 / 1;
      width: 24px;
      height: 24px;
    }

    .user-icon {
      width: 34px;
      height: 34px;
      background-color: #fff;
      color: var(--primary-color);
    }

    storix-icon {
      width: 24px;
      height: 24px;
    }
  `;

  render () {
    return html`
      <header>

        <h5>Storix.</h5>

        <ul>
          <paper-button>
            <storix-icon icon="plus" @click=${this._openWizardUpload.bind(this)}></storix-icon>
          </paper-button>

          <paper-button class="user-icon">
            <storix-icon icon="user-cicle" ></storix-icon>
          </paper-button>
        </ul>

      </header>
    `;
  }

  _openWizardUpload () {
    app.openDialog({
      mode: 'no-footer',
      title: 'Upload your files',
      pages: ['storix-upload-files']
    });
  }

}

customElements.define('storix-header', StorixHeader);
