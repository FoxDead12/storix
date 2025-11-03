import { html, LitElement, css } from "lit";
import '../components/storix-icon.js';
import './storix-photos.js'

export default class StorixHome extends LitElement {

  static styles = css`
    :host {
      width: 100%;
      overflow: hidden;
    }

    .filter-menus {
      display: flex;
      background-color: #fff;
      margin: 0px;
      padding: 0 24px;
      justify-content: center;
      align-items: center;
      gap: 20px;
      list-style: none;
    }

    .filter-menus paper-button {
      min-width: 150px;
      text-transform: capitalize;
      border-radius: 0px;
      border-bottom: 2px solid transparent;
      gap: 10px;
      transition: 300ms ease-in-out all;
    }

    .filter-menus paper-button[active] {
      color: var(--primary-color);
      border-color: var(--primary-color);
      font-weight: bold;
    }
  `;

  static properties = {
    menu: {
      type: String
    }
  }

  constructor () {
    super();
    this.menu = 'photos';
  }

  render () {
    return html`
      <div class="container">
        <ul class="filter-menus">
          <li>
            <paper-button @click=${this.changeMenu.bind(this)} menu="photos" ?active=${this.menu === 'photos' ? true : false} noink>
              <storix-icon icon="photo" ></storix-icon>
              Fotos
            </paper-button>
          </li>
          <li>
            <paper-button @click=${this.changeMenu.bind(this)} menu="files" ?active=${this.menu === 'files' ? true : false} noink>
              <storix-icon icon="folder-open" ></storix-icon>
              Diretórios
            </paper-button>
          </li>
        </ul>

        <div class="page-container">
          ${this.menu == 'photos' ? html`<storix-photos></storix-photos>` : ''}
        </div>
      </div>
    `
  }

  changeMenu (e) {
    const menu = e.target.getAttribute('menu');
    this.menu = menu;
  }

}

customElements.define('storix-home', StorixHome);
