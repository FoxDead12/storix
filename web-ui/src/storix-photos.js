import { html, LitElement, css } from "lit";

export default class StorixPhotos extends LitElement {

  static styles = css`
    :host {
      width: 100%;
      height: 100%;
    }
  `;

  render () {
    return html`

    `
  }

  // render () {
  //   return html`
  //     <ul class="list-container">
  //       ${repeat(this._items, (item) => item.uuid, this._renderItem.bind(this))}
  //     </ul>
  //   `;
  // }

}

customElements.define('storix-photos', StorixPhotos);
