import { html, LitElement, css } from "lit";
import { unsafeSVG } from 'lit-html/directives/unsafe-svg.js';

export class StorixIcon extends LitElement {

  static styles = css`
    :host {
      display: block;
      width: 24px;
      height: 24px;
      color: var(--text-primary);
    }
  `;

  static properties = {
    icon: {
      type: String
    },
    svg: {
      type: String
    }
  }

  async updated (changeProps) {
    if ( changeProps.has('icon') ) {
      const url = new URL(`/public/svgs/${this.icon}.svg`, window.location.origin);
      fetch(url)
        .then((res) => res.text())
        .then((svg) => this.svg = svg);
    }
  }

  render () {
    return html `${unsafeSVG(this.svg)}`
  }

}

customElements.define('storix-icon', StorixIcon);
