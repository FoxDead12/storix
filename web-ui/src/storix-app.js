import { html, css, LitElement } from 'lit';
import StorixBroker from '../components/storix-broker.js';
import StorixRoutes from '../modules/storix-routes.js';
import '../components/storix-toast.js';
import './storix-header.js'
import './storix-preview.js'
import '../components/storix-dialog/storix-dialog.js'

export default class StorixApp extends LitElement {

  static styles = css`
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
      padding: 12px 16px;
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
  }

  async connectedCallback () {
    await this._fetchUserSession();
    super.connectedCallback();
  }

  render () {
    return html `
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
    }
    setDefaultRoute();

    // ... event to handle mouse backwards ...
    window.addEventListener('popstate', (e) => {
      setDefaultRoute();
    })
  }

  // ********************************************* //
  // Session methods                               //
  // ********************************************* //

  async _fetchUserSession () {
    try {
      const data = await this.broker.get('session');
      this.session.user_id    = data.response.id;
      this.session.user_name  = data.response.name;
      this.session.user_email = data.response.email;
    } catch (e) {
      window.location.href = '/login';
    }
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

    this.pageRender.innerHTML = '';
    this.pageRender.appendChild(element);
  }

  openToast (payload) {
    this.toast.openToast(payload);
  }

  openDialog (dialog) {
    const component = document.createElement('storix-dialog');
    component.options = dialog;
    document.body.append(component);
  }

  openPreview (item) {
    const preview = document.createElement("storix-preview");
    preview.item = item;
    this.shadowRoot.append(preview);
  }

}

window.customElements.define('storix-app', StorixApp);
