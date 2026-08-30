import { a as i, i as i$1, x, B } from '../lit-element-build.js';
import { S as StorixBroker } from '../storix-toast-build.js';
import './storix-header.js';
import './storix-preview.js';
import '../storix-icon-build.js';
import '../paper-button-build.js';
import StorixSession from './storix-session.js';
import '../storix-text-build.js';
import '../iron-flex-layout-build.js';
import '../polymer-legacy-build.js';
import '../paper-ripple-behavior-build.js';

class StorixRoutes {

  components = {
    '/gallery': 'storix-photos',
    '/files': 'storix-files'
  }

  getComponentFromRoute (url) {
    return this.components[url];
  }

}

class StorixDialog extends i {

  static styles = i$1`
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
      border-radius: var(--radius-lg);
      top: 0px;
      left: 0px;
      outline: none;
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }

    dialog[open] {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .header {
      flex: 0 0 auto;
      padding: var(--space-3) var(--space-4);
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--primary-color);
    }

    .pages-container {
      box-sizing: border-box;
      padding: var(--space-4);
      margin: 0;
      width: 700px;
      height: min(70vh, 500px);
      aspect-ratio: 16/9;
      min-height: 0;
      display: flex;
    }

    @media (max-width: 768px) {
      .pages-container {
        width: 100%;
        height: min(95vh, 560px);
      }
    }

    .page-container {
      overflow: hidden;
      flex: none;
      display: flex;
      width: 100%;
      height: 100%;
      min-height: 0;
      min-width: 0;
    }

    .footer {
      flex: 0 0 auto;
      padding: var(--space-3) var(--space-4);
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
      border-radius: var(--radius-sm);
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
    return x`
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
          ? x`
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
      B(x`<span>${text}</span>`, element);
    } else if ( mode === 'icon' ) {
      B(x`<storix-icon icon="${icon}"></storix-icon>`, element);
    }

  }

  _renderPreviousButton () {

  }

}

customElements.define('storix-dialog', StorixDialog);

class StorixApp extends i {

  static styles = i$1`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    storix-header {
      flex: 0 0 auto; /* altura fixa (pega do próprio elemento) */
    }

    section {
      flex: 1 1 auto;
      overflow: auto;
      min-height: 0;
      padding: var(--space-3) var(--space-4);
      display: flex;
      flex-direction: column;
    }
  `

  constructor () {
    super();
    window.app   = this;
    this.broker  = new StorixBroker();
    this.session = new Object();
    this.routes  = new StorixRoutes();
    this.currentPage = null;
  }

  async connectedCallback () {
    await StorixSession.fetchSession();
    super.connectedCallback();
  }

  render () {
    return x `
      <storix-header></storix-header>
      <section id="page-render"></section>
      <storix-toast id="toast" ></storix-toast>
    `
  }

  firstUpdated () {
    this.toast = this.shadowRoot.getElementById('toast');
    this.pageRender = this.shadowRoot.getElementById('page-render');

    // ... set default url to start product ...
    const setDefaultRoute = () => {
      const pathname = window.location.pathname;
      if ( !pathname || pathname == '' || pathname == '/' ) {
        this.changeRoute('/gallery');
      } else {
        this.changeRoute(pathname);
      }
    };
    setDefaultRoute();

    // ... event to handle mouse backwards ...
    window.addEventListener('popstate', (e) => {
      setDefaultRoute();
    });

    document.body.addEventListener('error', (err) => {
      console.log("entrei no evento do david");
      console.log(err);
    });
  }


  // ********************************************* //
  // app methods                                   //
  // ********************************************* //
  async importModule (src) {
    await import(src);
  }

  /**
   *
   * @param {String} urlPath '/gallery'
   */
  async changeRoute (urlPath) {

    window.history.pushState({}, "", urlPath);

    const url = new URL(urlPath, window.location.origin);
    const component = this.routes.getComponentFromRoute(url.pathname);

    await this.importModule(`./${component}.js`);
    const element = document.createElement(component);
    this.currentPage = element;

    this.pageRender.innerHTML = '';
    this.pageRender.appendChild(element);

    window.dispatchEvent(new CustomEvent('route-changed', { detail: null }));

  }

  openToast (payload) {
    return this.toast.openToast(payload);
  }

  async openDialog (dialog) {
    const component = document.createElement('storix-dialog');
    component.options = dialog;
    document.body.append(component);
    await new Promise((res, rej) => {
      component.addEventListener('close', () => res());
    });
  }

  openPreview (item, type) {
    const preview = document.createElement("storix-preview");
    preview.item = item;
    preview.type = type;
    this.shadowRoot.append(preview);
  }

  removeItem (item) {
    const items = this.currentPage.items;
    const index = items.indexOf(item);
    if (index !== -1) {
      items.splice(index, 1);
      this.currentPage.requestUpdate();
    }
  }

}

window.customElements.define('storix-app', StorixApp);

export { StorixApp as default };
