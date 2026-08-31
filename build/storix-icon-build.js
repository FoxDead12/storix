import { E, T, a as i$1, i as i$2, x } from './lit-element-build.js';

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1={CHILD:2},e$1=t=>(...e)=>({_$litDirective$:t,values:e});class i{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i;}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class e extends i{constructor(i){if(super(i),this.it=E,i.type!==t$1.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(r){if(r===E||null==r)return this._t=void 0,this.it=r;if(r===T)return r;if("string"!=typeof r)throw Error(this.constructor.directiveName+"() called with a non-string value");if(r===this.it)return this._t;this.it=r;const s=[r];return s.raw=s,this._t={_$litType$:this.constructor.resultType,strings:s,values:[]}}}e.directiveName="unsafeHTML",e.resultType=1;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class t extends e{}t.directiveName="unsafeSVG",t.resultType=2;const o=e$1(t);

class StorixIcon extends i$1 {

  static styles = i$2`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-primary);
    }

    svg {
      max-width: var(--icon-max-width, auto);
      width: var(--icon-width, 24px);
      height: var(--icon-height, 24px);
      stroke-width: var(--icon-stroke-width, 1);
      fill: var(--icon-fill, #fff);
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
      fetch(url, { cache: 'default' })
        .then((res) => res.text())
        .then((svg) => this.svg = svg);
    }
  }

  render () {
    return x `${o(this.svg)}`
  }

}

customElements.define('storix-icon', StorixIcon);

export { e$1 as e, i, t$1 as t };
