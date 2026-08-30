import { a as i, i as i$1, x } from '../lit-element-build.js';
import '../storix-icon-build.js';
import './storix-photos.js';
import '../repeat-build.js';
import '../storix-text-build.js';
import '../polymer-legacy-build.js';
import '../iron-validatable-behavior-build.js';
import '../color-build.js';
import '../paper-ripple-behavior-build.js';

class StorixHome extends i {

  static styles = i$1`
    :host {
      width: 100%;
      overflow: hidden;
    }

    .filter-menus {
      display: flex;
      background-color: var(--surface-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      margin: 0px 0px var(--space-3) 0px;
      padding: 0 var(--space-5);
      justify-content: center;
      align-items: center;
      gap: var(--space-5);
      list-style: none;
    }

    .filter-menus paper-button {
      min-width: 150px;
      text-transform: capitalize;
      border-radius: 0px;
      border-bottom: 2px solid transparent;
      gap: 10px;
      transition: 150ms ease-in-out all;
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
    return x`
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
          ${this.menu == 'photos' ? x`<storix-photos></storix-photos>` : ''}
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

export { StorixHome as default };
