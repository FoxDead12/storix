import { html, LitElement, css, render } from "lit";
import { repeat } from 'lit/directives/repeat.js';
import StorixText from "../modules/storix-text.js";
import '../components/storix-icon.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '../components/storix-actions.js'

export default class StorixPhotos extends LitElement {

  static styles = css`
    :host {
      position: relative;
      overflow: hidden;
      flex: 1 1 auto;
    }

    ul {
      max-height: 100%;
      list-style: none;

      padding: 0px;
      margin: 0px;
      gap: 0.5rem;

      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
      grid-auto-rows: 55px;

      overflow: scroll;
      scrollbar-width: none;
      padding-right: 20px;
    }

    ul::-webkit-scrollbar {
      display: none;
    }

    .year-scrubber {
      position: absolute;
      top: 0;
      right: 4px;
      bottom: 0;
      width: 14px;
      display: flex;
      flex-direction: column;
      z-index: 3;
    }

    .year-marker {
      position: relative;
      flex-grow: 1;
      min-height: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .year-marker::before {
      content: '';
      width: 4px;
      height: 100%;
      border-radius: 2px;
      background-color: rgba(0, 0, 0, 0.15);
      transition: 150ms ease-in-out all;
    }

    .year-marker:hover::before,
    .year-marker.active::before {
      background-color: var(--primary-color);
    }

    .year-label {
      position: absolute;
      right: 18px;
      padding: 2px 8px;
      border-radius: 4px;
      background-color: rgba(0, 0, 0, 0.75);
      color: #fff;
      font-size: 13px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: 150ms ease-in-out opacity;
    }

    .year-marker:hover .year-label,
    .year-marker.active .year-label {
      opacity: 1;
    }

    ul > li {
      position: relative;
      grid-column: span 3;
      grid-row: span 4;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border-radius: 5px;
      overflow: hidden;
    }

    .image-container {
      box-shadow:
        0 1px 1px hsl(0deg 0% 0% / 0.075),
        0 2px 2px hsl(0deg 0% 0% / 0.075),
        0 4px 4px hsl(0deg 0% 0% / 0.075),
        0 8px 8px hsl(0deg 0% 0% / 0.075),
        0 16px 16px hsl(0deg 0% 0% / 0.075);
      background-color: #ccc;
      cursor: pointer;
    }

    .image-container::before {
      content: '';
      position: absolute;
      top: 0px;
      left: 0px;
      height: 100%;
      width: 100%;
    }

    .image-container:hover::before {
      background-color: rgba(0, 0, 0, 0.2);
    }

    .image-container > paper-checkbox {
      position: absolute;
      display: none;
      left: 12px;
      top: 12px;
      z-index: 2;
      --paper-checkbox-unchecked-color: #fff;
    }

    .image-container:hover > paper-checkbox,
    .image-container > paper-checkbox[active] {
      display: block;
    }

    ul > .separator {
      grid-column: 1/-1;
      grid-row: span 1;
    }

    ul > li > img {
      object-fit: cover;
      color: transparent;
      transition: 200ms all ease-in-out;
      border-radius: 5px;
    }

    .video-container {
      position: absolute;
      left: 0px;
      top: 0px;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .video-camera-icon {
      color: var(--primary-color);
      border-radius: 50%;
      background: #fff;
      padding: 8px;
    }


    .month-title {
      font-size: 28px;
      font-weight: normal;
      padding: 0px;
      margin: 0;
      padding-top: 20px;
    }

    .day-title {
      font-size: 18px;
      font-weight: normal;
      padding: 0px;
      margin: 0;
      padding-top: 12px;
    }


    .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .icon-empty {
      --icon-max-width: 650px;
      --icon-width: 100%;
      --icon-height: 100%;
    }

    storix-actions > paper-button {
      color: #fff;
      margin: 0;
    }

    @media (max-width: 768px) {
      .image-container > paper-checkbox {
        display: block;
      }
    }

  `;

  static properties = {
    _stopFetch: {
      typeof: Boolean
    },
    // ... this prop need be equal in all pages of project, the app will try catch ...
    items: {
      typeof: Array
    },
    // ... this prop need be equal in all pages of project, the app will try catch ...
    selectedItems: {
      typeof: Array
    },
    page: {
      typeof: Number
    },
    _yearCounts: {
      typeof: Array
    },
    _activeYear: {
      typeof: Number
    }
  }

  constructor () {
    super();
    this.items = new Array();
    this.selectedItems = new Array();
    this._stopFetch = false;
    this.page = 1;
    this._yearCounts = new Array();
    this._activeYear = null;

    app.photos = this.items;
  }

  render () {
    return html`
      <ul class="files-list" id="files-list" @scroll=${this.onScroll.bind(this)}>
        ${repeat(this.items, (items) => items.uuid, this.renderItem.bind(this))}
      </ul>
      ${this.items.length == 0 ? this.renderEmptyList() : ''}
      ${this._yearCounts.length > 0 ? this.renderYearScrubber() : ''}
    `
  }

  firstUpdated () {
    this.list = this.shadowRoot.getElementById('files-list');
    this.fetchYearCounts();
  }

  updated (changeProps) {
    if ( changeProps.has('page') && !this._stopFetch && !this._jumping ) {
      this.fetchPhotos();
    }

    if ( changeProps.has('selectedItems') ) {
      window.dispatchEvent(new CustomEvent('selected-items-changed', { detail: null }));
    }
  }

  async _fetchPageRaw (page) {
    const result = await app.broker.get('files?filter[p_photos]=true&page=' + page);
    return result.data;
  }

  // ... turns a raw page of files into { separator } + file entries, appending to this.items ...
  _appendItems (rawItems) {

    const newItems = [];

    for ( const item of rawItems ) {

      const date_day = item.birthtime_date;
      const date_month = item.birthtime_date.slice(0, 7);

      if ( this.currentMonth != date_month ) {
        this.currentMonth = date_month;
        const separator = { separator: true, month: date_month };
        newItems.push(separator);
      }


      if ( this.currentDay != date_day ) {
        this.currentDay = date_day;
        const separator = { separator: true, day: date_day };
        newItems.push(separator);
      }

      newItems.push(item);
    }

    this.items.push(...newItems);

  }

  async fetchPhotos () {

    const rawItems = await this._fetchPageRaw(this.page);
    this._appendItems(rawItems);

    // ... force lit to render all images ...
    this.requestUpdate();
    await this.updateComplete;

    // ... after lit render ...
    if ( rawItems.length < 100 ) {
      this._stopFetch = true;
    } else {
      if ( this.list.clientHeight < this.clientHeight ) {
        this.page += 1;
      }
    }

    this._updateActiveYearFromScroll();

  }

  async fetchYearCounts () {
    const result = await app.broker.get('files?filter[p_photos]=true&aggregate=years');
    this._yearCounts = result.data.map((row) => ({ year: Number(row.year), count: Number(row.count) }));
  }

  async _jumpToYear (year) {

    // ... how many photos exist before this year starts (newer than it) ...
    const offset = this._yearCounts
      .filter((y) => y.year > year)
      .reduce((sum, y) => sum + y.count, 0);

    const targetPage = Math.floor(offset / 100) + 1;

    this.items = [];
    this.currentMonth = null;
    this.currentDay = null;
    this._stopFetch = false;
    this._activeYear = year;

    // ... drive this fetch ourselves instead of relying on updated(), so we can
    // scroll to the exact separator once the last page (which may still start with
    // photos from the previous year, when this year has few photos) has loaded.
    // Fetch every page from the top through the target one (in parallel, then applied
    // in order) instead of just the target page, so scrolling back up afterwards still
    // has the newer years already loaded, instead of hitting a dead end ...
    this._jumping = true;

    try {

      const pages = await Promise.all(
        Array.from({ length: targetPage }, (_, i) => this._fetchPageRaw(i + 1))
      );

      let lastPageLength = 100;
      for ( const rawItems of pages ) {
        this._appendItems(rawItems);
        lastPageLength = rawItems.length;
      }

      this.requestUpdate();
      await this.updateComplete;

      if ( lastPageLength < 100 ) {
        this._stopFetch = true;
        this.page = targetPage;
      } else {
        this.page = targetPage + 1;
      }

    } finally {
      this._jumping = false;
    }

    this._scrollToYear(year);

  }

  _scrollToYear (year) {

    if ( !this.list ) return;

    const separator = this.list.querySelector(`li.separator[data-year="${year}"]`);
    this.list.scrollTop = separator ? separator.offsetTop : 0;

  }

  _updateActiveYearFromScroll () {

    if ( !this.list ) return;

    const separators = this.list.querySelectorAll('li.separator[data-year]:not([data-year=""])');
    let closest = null;
    for ( const separator of separators ) {
      if ( separator.offsetTop <= this.list.scrollTop + 40 ) {
        closest = separator;
      } else {
        break;
      }
    }

    if ( !closest ) return;

    const year = Number(closest.dataset.year);
    if ( !Number.isNaN(year) && year !== this._activeYear ) {
      this._activeYear = year;
    }

  }

  _onImageLoad (e) {

    const img = e.currentTarget;
    const parent = img.parentElement;

    const isLandscape = img.width > img.height;

    img.style.width = '100%';
    img.style.height = '100%';

    if (isLandscape) {
      parent.setAttribute('style', 'grid-column: span 6; grid-row: span 4;');
    } else {
      parent.setAttribute('style', 'grid-column: span 3; grid-row: span 4;');
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const img = entry.target;
        const uuid = img.getAttribute('uuid');
        if (entry.isIntersecting) {
          // ... image are in viewport ...
          if (img.dataset.loaded == "false") {
            img.src = `/api/download?uuid=${uuid}&filter[thumbnail]=true`;
            img.dataset.loaded = "true";
          }
        } else {
          // ... imare are not in viewport ...
          const rect = entry.boundingClientRect;
          const buffer = 1500;
          if (rect.bottom < -buffer || rect.top > window.innerHeight + buffer) {
            img.src = "";
            img.dataset.loaded = "false";
          }
        }
      });
    }, { root: null, rootMargin: '300px 0px 300px 0px', threshold: 0 });

    observer.observe(img);

  }

  onScroll (e) {

    const element = e.currentTarget;

    if ( !this._stopFetch && element.offsetHeight + element.scrollTop >= element.scrollHeight - 300 ) {
      this.page += 1;
    }

    this._updateActiveYearFromScroll();

  }

  _showPreview (e) {
    const item = e.currentTarget.item;
    app.openPreview(item, 'photos');
  }

  _selectItemChange (e) {

    // ... get necessary props ...
    const active = e.currentTarget.active;
    const img    = e.currentTarget.parentElement.querySelector('img');
    const item   = e.currentTarget.parentElement.item;

    if ( active == true ) {
      img.style.transform = "scale3d(0.95, 0.90, 0.90)";
      // ... add item from array ...
      this.selectedItems.push(item);
      this.requestUpdate('selectedItems');
    } else {
      img.style.transform = "scale3d(1, 1, 1)";
      // ... remove item from array ...
      const indice = this.selectedItems.indexOf(item);
      this.selectedItems.splice(indice, 1);
      this.requestUpdate('selectedItems');
    }

  }

  renderItem (item) {

    if ( item.separator === true ) {
      const month_date = item.month ? new Date(item.month) : null;
      const day_date   = item.day ? new Date(item.day) : null;
      return html`
        <li class="separator" data-year=${month_date ? month_date.getFullYear() : ''}>
          ${ month_date ? html`<p class="month-title">${StorixText.months[month_date.getMonth()]} ${month_date.getFullYear()}</p>` : '' }
          ${ day_date   ? html`<p class="day-title">${StorixText.days[day_date.getDay()]}, ${day_date.getDate().toString().padStart(2, 0)}/${(day_date.getMonth() + 1).toString().padStart(2, 0)}</p>` : '' }
        </li>
      `;
    } else {
      return html`
        <li class="image-container" @click=${this._showPreview.bind(this)} .item=${item} @error=${(e) => console.log(e) }>
          <paper-checkbox @click=${(e) => e.stopPropagation()} @change=${this._selectItemChange.bind(this)}></paper-checkbox>
          <img src="/api/download?uuid=${item.uuid}&filter[thumbnail]=true" alt="${item.description}" uuid=${item.uuid} loading="lazy" @load=${this._onImageLoad.bind(this)}/>
          ${item.type === 'video' ? html`<div class="video-container"><storix-icon class="video-camera-icon" icon="video-camera"></storix-icon></div>` : ''}
        </li>
      `;
    }

  }

  renderEmptyList () {
    return html`
      <div class="empty-container">
        <storix-icon class="icon-empty" icon="empty-list"></storix-icon>
        <p>Don't exist nothing to show. Uplaod your files</p>
      </div>
    `
  }

  renderYearScrubber () {
    return html`
      <div class="year-scrubber">
        ${this._yearCounts.map((y) => html`
          <div
            class="year-marker ${this._activeYear === y.year ? 'active' : ''}"
            style="flex-grow: ${y.count}"
            @click=${() => this._jumpToYear(y.year)}
          >
            <span class="year-label">${y.year}</span>
          </div>
        `)}
      </div>
    `
  }
}

customElements.define('storix-photos', StorixPhotos);
