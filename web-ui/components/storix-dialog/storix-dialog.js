import { html, LitElement, css, render } from "lit";
import '../storix-icon.js';
import '@polymer/paper-button/paper-button.js';

export default class StorixDialog extends LitElement {

  static styles = css`
    dialog::backdrop {
      content: "";
      position: fixed;
      inset: 0px;
      background: rgba(0, 0, 0, .4);
      backdrop-filter: blur(2px);
    }

    dialog {
      padding: 0px;
      border: none;
      border-radius: 8px;
      top: 0px;
      left: 0px;
      outline: none;
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
    }

    dialog[open] {
      display: flex;
      flex-direction: column;
    }

    .header {
      padding: 12px 16px;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--primary-color);
    }

    .pages-container {
      box-sizing: border-box;
      padding: 12px 16px;
      margin: 0;
      width: 700px;
      aspect-ratio: 16/9;
      display: flex;
    }

    @media (max-width: 768px) {
      .pages-container {
        width: 100%;
        min-height: 500px;
      }
    }

    .page-container {
      overflow: hidden;
      flex: none;
      display: flex;
      width: 100%;
      height: 100%;
    }

    .footer {
      padding: 12px 16px;
      box-shadow: rgba(149, 157, 165, 0.2) 0px -8px 24px;
      display: flex;
      justify-content: flex-end;
    }

    .header > h1 {
      padding: 0px;
      margin: 0px;
      font-weight: bold;
      font-size: 18px;
      color: #fff;
      letter-spacing: 1px;
    }

    .header > paper-button {
      min-width: 0 !important;
      padding: 0px;
      margin: 0px;
      border-radius: 50%;
      aspect-ratio: 1 / 1;
      width: 32px;
      height: 32px;
    }

    .header > paper-button > storix-icon {
      --icon-width: 32px;
      --icon-height: 32px;
      color: #fff;
    }

    .footer > .button-next {
      min-width: 24px !important;
      margin: 0px;
      background-color: var(--primary-color);
      color: #fff;
      border-radius: 5px;
    }

  `;

  static properties = {
    options: {
      typeof: Object
    },
    _pages: {
      typeof: Array
    },
    _currentPageFocus: {
      typeof: String
    },
    mode: {
      typeof: String
    },
    title: {
      typeof: String
    }
  }

  disconnectedCallback () {
    super.disconnectedCallback();
    this.dispatchEvent(new CustomEvent('close', { detail: null }));
  }

  render () {
    return html`
      <dialog id="dialog">

        <ol class="header">
          <h1>${this.title}</h1>
          <paper-button>
            <storix-icon icon="x-circle" @click=${this.close.bind(this)}></storix-icon>
          </paper-button>
        </ol>

        <div class="pages-container" id="pages-container">
        </div>

        ${ this.mode !== 'no-footer'
          ? html`
            <div class="footer">
              <paper-button raised class="button-next" id="button-next" @click=${this.nextClick.bind(this)}></paper-button>
            </div>
          `
          : ''
        }

      </dialog>
    `;
  }

  updated (propsChanges) {

    if ( propsChanges.has('_currentPageFocus') ) {
      this._focusPage(this._currentPageFocus);
    }

  }

  firstUpdated () {
    // ... get from dom necessary elements ...
    this.dialog = this.shadowRoot.getElementById('dialog');
    this.pagesContainers = this.shadowRoot.getElementById('pages-container');
    this.nextButton = this.shadowRoot.getElementById('button-next');

    // ... parse options to props ...
    if ( this.options ) {
      this.title  = this.options?.title;
      this.mode   = this.options?.mode;
      this._pages = this.options?.pages;
    }

    // ... prepare to show modal ...
    this.dialog.showModal();
    this._preloadPages();
    this.changeNextButtonToIcon('rocket-launch');
  }

  _preloadPages () {

    for ( const pageName of this._pages ) {
      const container = document.createElement('div');
      const page = document.createElement(pageName);

      container.className = 'page-container';
      page.dialog = this;

      container.append(page);
      this.pagesContainers.append(container);
    }

    this._currentPageFocus = this._pages[0];
  }

  async _focusPage (page) {
    await app.importModule(`./${page}.js`);
    const elementPage = this.shadowRoot.querySelector(page);
    elementPage.scrollTo();
    elementPage.enter();
  }

  close () {
    this.remove();
  }

  async nextClick (e) {

    const button = e.currentTarget;
    button.setAttribute('disabled', true);

    for ( const pageName of this._pages ) {
      const page = this.shadowRoot.querySelector(pageName);
      await page.save();
    }

    button.removeAttribute('disabled');

  }

  // -------------------------------------------------------------------- //
  // BUTTONS CONTROLLER/RENDER METHODS
  // -------------------------------------------------------------------- //
  changeNextButtonToIcon (icon) {
    this._renderNextButton({mode: 'icon', icon});
  }

  changeNextButtonToText (text) {
    this._renderNextButton({mode: 'text', text});
  }

  _renderNextButton ({mode, text, icon}) {
    const element = this.nextButton;

    if ( mode === 'text' ) {
      render(html`<span>${text}</span>`, element);
    } else if ( mode === 'icon' ) {
      render(html`<storix-icon icon="${icon}"></storix-icon>`, element);
    }

  }

  _renderPreviousButton () {

  }

}

customElements.define('storix-dialog', StorixDialog);
