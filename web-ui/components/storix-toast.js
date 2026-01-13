import { html, LitElement, css } from "lit";

export default class StorixToast extends LitElement {

  static styles = css `
    :host {
      position: fixed;
      right: 0px;
      bottom: 0px;
      padding: 0px;
      margin: 0px;
      gap: 12px;
      padding: 12px 12px;
      display: flex;
      flex-direction: column;
      display: flex;
      justify-content: flex-start; /* alinha no início, sem forçar espaço igual */
      align-items: flex-end;
      pointer-events: none; /* pai não recebe clique */
    }

    .toast {
      pointer-events: auto; /* filhos ainda recebem clique */
      flex: 0 0 auto; /* não cresce nem encolhe */
      width: auto;
      min-width: 300px;
      position: relative;
      padding: 12px 18px;
      border-radius: 3px;
      border-left: 10px solid;
      cursor: pointer;
      box-shadow:
        0 1px 1px hsl(0deg 0% 0% / 0.075),
        0 2px 2px hsl(0deg 0% 0% / 0.075);
    }

    .toast::before {
      content: '';
      position: absolute;
      width: 100%;
      background: #fff;
      height: 100%;
      left: 0px;
      top: 0px;
      z-index: -1;
    }

    .toast > p {
      padding: 0px;
      margin: 0px;
      font-size: 16px;
      font-weight: normal;
      color: var(--text-color);
    }

    .toast > p:first-child {
      font-size: 13px;
      font-weight: bold;
    }

    .toast.success {
      border-color: #17B978;
      background: rgb(23 185 120 / 25%);
    }

    .toast.warning {
      border-color: #FBC02D;
      background: rgb(251 192 45 / 25%);
    }

    .toast.error {
      border-color: #D50000;
      background: rgb(213 0 0 / 20%);
    }

    .toast.info {
      border-color: #0004FF;
      background: rgb(0 4 255 / 20%);
    }

  `;

  openToast ({ message, duration, status, no_duration }) {

    const element = document.createElement('div');
    const title = document.createElement('p');
    const text = document.createElement('p');

    element.classList.add('toast');
    element.classList.add(status);

    text.innerHTML = message;
    switch (status) {
      case 'success': title.innerHTML = 'Success'; break;
      case 'warning': title.innerHTML = 'Error'; break;
      case 'error': title.innerHTML = 'Warning'; break;
      case 'info': title.innerHTML = 'Info'; break;

    }

    element.appendChild(title);
    element.appendChild(text);
    this.shadowRoot.appendChild(element);

    element.addEventListener('click', () => element.remove());

    if ( !no_duration ) {
      setTimeout(() => element.remove(), duration || 3000);
    }

    return element;
  }

}

customElements.define('storix-toast', StorixToast);
