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

    .image-container.placeholder {
      cursor: default;
    }

    .image-container.placeholder:hover::before {
      background-color: transparent;
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
    // ... this prop need be equal in all pages of project, the app will try catch ...
    items: {
      typeof: Array
    },
    // ... this prop need be equal in all pages of project, the app will try catch ...
    selectedItems: {
      typeof: Array
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
    this._yearCounts = new Array();
    this._activeYear = null;

    app.photos = this.items;
  }

  render () {
    return html`
      <ul class="files-list" id="files-list" @scroll=${this.onScroll.bind(this)}>
        ${repeat(this.items, (item) => item.key || item.uuid, this.renderItem.bind(this))}
      </ul>
      ${this.items.length == 0 ? this.renderEmptyList() : ''}
      ${this._yearCounts.length > 0 ? this.renderYearScrubber() : ''}
    `
  }

  firstUpdated () {

    this.list = this.shadowRoot.getElementById('files-list');
    this._observedSentinels = new WeakSet();
    this._loadedPages = new Set();
    this._loadingPages = new Set();

    // ... watch placeholders as they approach the viewport (in either scroll
    // direction) and load the real page they belong to ...
    this._pageObserver = new IntersectionObserver((entries) => {
      for ( const entry of entries ) {
        if ( entry.isIntersecting ) {
          this._pageObserver.unobserve(entry.target);
          this._loadPage(Number(entry.target.dataset.page));
        }
      }
    }, { root: this.list, rootMargin: '800px 0px 800px 0px', threshold: 0 });

    this._init();

  }

  async _init () {
    await this.fetchYearCounts();
    this._buildSkeleton();
  }

  updated (changeProps) {

    this._attachPageObservers();

    if ( changeProps.has('selectedItems') ) {
      window.dispatchEvent(new CustomEvent('selected-items-changed', { detail: null }));
    }
  }

  // ... creates one placeholder entry per photo (we already know the totals from
  // the year counts), so the scrollbar/scroll height is correct from the start
  // and scrolling in any direction has something to load towards ...
  _buildSkeleton () {

    const total = this._yearCounts.reduce((sum, y) => sum + y.count, 0);
    this._totalPages = Math.max(1, Math.ceil(total / 100));

    for ( let page = 1; page <= this._totalPages; page++ ) {
      const countInPage = Math.min(100, total - (page - 1) * 100);
      for ( let i = 0; i < countInPage; i++ ) {
        this.items.push({ placeholder: true, page, sentinel: i === 0, key: `ph-${page}-${i}` });
      }
    }

    this.requestUpdate();

  }

  _attachPageObservers () {

    if ( !this.list ) return;

    const sentinels = this.list.querySelectorAll('[data-sentinel="1"]');
    for ( const el of sentinels ) {
      if ( this._observedSentinels.has(el) ) continue;
      this._observedSentinels.add(el);
      this._pageObserver.observe(el);
    }

  }

  async _fetchPageRaw (page) {
    const result = await app.broker.get('files?filter[p_photos]=true&page=' + page);
    return result.data;
  }

  async fetchYearCounts () {
    const result = await app.broker.get('files?filter[p_photos]=true&aggregate=years');
    this._yearCounts = result.data.map((row) => ({ year: Number(row.year), count: Number(row.count) }));
  }

  async _loadPage (page) {

    if ( this._loadedPages.has(page) || this._loadingPages.has(page) ) return;
    this._loadingPages.add(page);

    let rawItems;
    try {
      rawItems = await this._fetchPageRaw(page);
    } finally {
      this._loadingPages.delete(page);
    }

    this._loadedPages.add(page);

    // ... find this page's placeholder slot, it might have shifted position
    // since other pages loaded (their real content can be a different length
    // than 100, once separators are added) ...
    const startIndex = this.items.findIndex((it) => it.placeholder && it.page === page);
    if ( startIndex === -1 ) return;

    let endIndex = startIndex;
    while ( endIndex < this.items.length && this.items[endIndex].placeholder && this.items[endIndex].page === page ) {
      endIndex++;
    }

    const entries = this._buildPageEntries(startIndex, rawItems);
    this.items.splice(startIndex, endIndex - startIndex, ...entries);
    this.requestUpdate();
    await this.updateComplete;

    this._attachPageObservers();
    this._updateActiveYearFromScroll();

  }

  // ... turns a raw page of files into { separator } + file entries, using
  // whatever real item is already loaded right before this page (if any) to
  // avoid repeating its month/day separator ...
  _buildPageEntries (startIndex, rawItems) {

    const entries = [];

    let prevMonth = null;
    let prevDay = null;
    for ( let i = startIndex - 1; i >= 0; i-- ) {
      const it = this.items[i];
      if ( it.placeholder || it.separator ) continue;
      prevMonth = it.birthtime_date.slice(0, 7);
      prevDay = it.birthtime_date;
      break;
    }

    for ( const item of rawItems ) {

      const date_day = item.birthtime_date;
      const date_month = item.birthtime_date.slice(0, 7);

      if ( prevMonth !== date_month ) {
        entries.push({ separator: true, month: date_month, key: `sep-m-${date_month}` });
        prevMonth = date_month;
      }

      if ( prevDay !== date_day ) {
        entries.push({ separator: true, day: date_day, key: `sep-d-${date_day}` });
        prevDay = date_day;
      }

      entries.push(item);
    }

    return entries;

  }

  async _jumpToYear (year) {

    // ... how many photos exist before this year starts (newer than it) ...
    const offset = this._yearCounts
      .filter((y) => y.year > year)
      .reduce((sum, y) => sum + y.count, 0);

    const targetPage = Math.floor(offset / 100) + 1;

    this._activeYear = year;

    // ... the skeleton already covers the whole gallery, so jumping is just
    // making sure this one page is loaded and scrolling to it - the pages
    // around it stay as placeholders until scroll gets near them ...
    await this._loadPage(targetPage);
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

    if ( item.placeholder === true ) {
      return html`
        <li class="image-container placeholder" data-page=${item.page} data-sentinel=${item.sentinel ? '1' : '0'}></li>
      `;
    }

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
