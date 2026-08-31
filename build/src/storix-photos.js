import { a as i, i as i$1, x } from '../lit-element-build.js';
import { c } from '../repeat-build.js';
import { S as StorixText } from '../storix-text-build.js';
import '../storix-icon-build.js';
import { h as html, P as Polymer } from '../polymer-legacy-build.js';
import { a as IronFormElementBehavior, I as IronValidatableBehavior } from '../iron-validatable-behavior-build.js';
import { b as IronButtonState, I as IronControlState, P as PaperRippleBehavior } from '../paper-ripple-behavior-build.js';
import '../color-build.js';

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/


let scheduled = false;
let beforeRenderQueue = [];
let afterRenderQueue = [];

function schedule() {
  scheduled = true;
  // before next render
  requestAnimationFrame(function() {
    scheduled = false;
    flushQueue(beforeRenderQueue);
    // after the render
    setTimeout(function() {
      runQueue(afterRenderQueue);
    });
  });
}

function flushQueue(queue) {
  while (queue.length) {
    callMethod(queue.shift());
  }
}

function runQueue(queue) {
  for (let i=0, l=queue.length; i < l; i++) {
    callMethod(queue.shift());
  }
}

function callMethod(info) {
  const context = info[0];
  const callback = info[1];
  const args = info[2];
  try {
    callback.apply(context, args);
  } catch(e) {
    setTimeout(() => {
      throw e;
    });
  }
}

/**
 * Enqueues a callback which will be run after the next render, equivalent
 * to one task (`setTimeout`) after the next `requestAnimationFrame`.
 *
 * This method is useful for tuning the first-render performance of an
 * element or application by deferring non-critical work until after the
 * first paint.  Typical non-render-critical work may include adding UI
 * event listeners and aria attributes.
 *
 * @param {*} context Context object the callback function will be bound to
 * @param {function(...*):void} callback Callback function
 * @param {!Array=} args An array of arguments to call the callback function with
 * @return {void}
 */
function afterNextRender(context, callback, args) {
  if (!scheduled) {
    schedule();
  }
  afterRenderQueue.push([context, callback, args]);
}

/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Use `IronCheckedElementBehavior` to implement a custom element that has a
 * `checked` property, which can be used for validation if the element is also
 * `required`. Element instances implementing this behavior will also be
 * registered for use in an `iron-form` element.
 *
 * @demo demo/index.html
 * @polymerBehavior IronCheckedElementBehavior
 */
const IronCheckedElementBehaviorImpl = {

  properties: {
    /**
     * Fired when the checked state changes.
     *
     * @event iron-change
     */

    /**
     * Gets or sets the state, `true` is checked and `false` is unchecked.
     */
    checked: {
      type: Boolean,
      value: false,
      reflectToAttribute: true,
      notify: true,
      observer: '_checkedChanged'
    },

    /**
     * If true, the button toggles the active state with each tap or press
     * of the spacebar.
     */
    toggles: {type: Boolean, value: true, reflectToAttribute: true},

    /* Overriden from IronFormElementBehavior */
    value: {type: String, value: 'on', observer: '_valueChanged'}
  },

  observers: ['_requiredChanged(required)'],

  created: function() {
    // Used by `iron-form` to handle the case that an element with this behavior
    // doesn't have a role of 'checkbox' or 'radio', but should still only be
    // included when the form is serialized if `this.checked === true`.
    this._hasIronCheckedElementBehavior = true;
  },

  /**
   * Returns false if the element is required and not checked, and true
   * otherwise.
   * @param {*=} _value Ignored.
   * @return {boolean} true if `required` is false or if `checked` is true.
   */
  _getValidity: function(_value) {
    return this.disabled || !this.required || this.checked;
  },

  /**
   * Update the aria-required label when `required` is changed.
   */
  _requiredChanged: function() {
    if (this.required) {
      this.setAttribute('aria-required', 'true');
    } else {
      this.removeAttribute('aria-required');
    }
  },

  /**
   * Fire `iron-changed` when the checked state changes.
   */
  _checkedChanged: function() {
    this.active = this.checked;
    this.fire('iron-change');
  },

  /**
   * Reset value to 'on' if it is set to `undefined`.
   */
  _valueChanged: function() {
    if (this.value === undefined || this.value === null) {
      this.value = 'on';
    }
  }
};

/** @polymerBehavior */
const IronCheckedElementBehavior = [
  IronFormElementBehavior,
  IronValidatableBehavior,
  IronCheckedElementBehaviorImpl
];

/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/

/**
 * `PaperInkyFocusBehavior` implements a ripple when the element has keyboard
 * focus.
 *
 * @polymerBehavior PaperInkyFocusBehavior
 */
const PaperInkyFocusBehaviorImpl = {
  observers: ['_focusedChanged(receivedFocusFromKeyboard)'],

  _focusedChanged: function(receivedFocusFromKeyboard) {
    if (receivedFocusFromKeyboard) {
      this.ensureRipple();
    }
    if (this.hasRipple()) {
      this._ripple.holdDown = receivedFocusFromKeyboard;
    }
  },

  _createRipple: function() {
    var ripple = PaperRippleBehavior._createRipple();
    ripple.id = 'ink';
    ripple.setAttribute('center', '');
    ripple.classList.add('circle');
    return ripple;
  }
};

/** @polymerBehavior */
const PaperInkyFocusBehavior = [
  IronButtonState,
  IronControlState,
  PaperRippleBehavior,
  PaperInkyFocusBehaviorImpl
];

/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Use `PaperCheckedElementBehavior` to implement a custom element that has a
 * `checked` property similar to `IronCheckedElementBehavior` and is compatible
 * with having a ripple effect.
 * @polymerBehavior PaperCheckedElementBehavior
 */
const PaperCheckedElementBehaviorImpl = {
  /**
   * Synchronizes the element's checked state with its ripple effect.
   */
  _checkedChanged: function() {
    IronCheckedElementBehaviorImpl._checkedChanged.call(this);
    if (this.hasRipple()) {
      if (this.checked) {
        this._ripple.setAttribute('checked', '');
      } else {
        this._ripple.removeAttribute('checked');
      }
    }
  },

  /**
   * Synchronizes the element's `active` and `checked` state.
   */
  _buttonStateChanged: function() {
    PaperRippleBehavior._buttonStateChanged.call(this);
    if (this.disabled) {
      return;
    }
    if (this.isAttached) {
      this.checked = this.active;
    }
  }
};

/** @polymerBehavior */
const PaperCheckedElementBehavior = [
  PaperInkyFocusBehavior,
  IronCheckedElementBehavior,
  PaperCheckedElementBehaviorImpl
];

/**
@license
Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const template = html`<style>
  :host {
    display: inline-block;
    white-space: nowrap;
    cursor: pointer;
    --calculated-paper-checkbox-size: var(--paper-checkbox-size, 18px);
    /* -1px is a sentinel for the default and is replaced in \`attached\`. */
    --calculated-paper-checkbox-ink-size: var(--paper-checkbox-ink-size, -1px);
    @apply --paper-font-common-base;
    line-height: 0;
    -webkit-tap-highlight-color: transparent;
  }

  :host([hidden]) {
    display: none !important;
  }

  :host(:focus) {
    outline: none;
  }

  .hidden {
    display: none;
  }

  #checkboxContainer {
    display: inline-block;
    position: relative;
    width: var(--calculated-paper-checkbox-size);
    height: var(--calculated-paper-checkbox-size);
    min-width: var(--calculated-paper-checkbox-size);
    margin: var(--paper-checkbox-margin, initial);
    vertical-align: var(--paper-checkbox-vertical-align, middle);
    background-color: var(--paper-checkbox-unchecked-background-color, transparent);
  }

  #ink {
    position: absolute;

    /* Center the ripple in the checkbox by negative offsetting it by
     * (inkWidth - rippleWidth) / 2 */
    top: calc(0px - (var(--calculated-paper-checkbox-ink-size) - var(--calculated-paper-checkbox-size)) / 2);
    left: calc(0px - (var(--calculated-paper-checkbox-ink-size) - var(--calculated-paper-checkbox-size)) / 2);
    width: var(--calculated-paper-checkbox-ink-size);
    height: var(--calculated-paper-checkbox-ink-size);
    color: var(--paper-checkbox-unchecked-ink-color, var(--primary-text-color));
    opacity: 0.6;
    pointer-events: none;
  }

  #ink:dir(rtl) {
    right: calc(0px - (var(--calculated-paper-checkbox-ink-size) - var(--calculated-paper-checkbox-size)) / 2);
    left: auto;
  }

  #ink[checked] {
    color: var(--paper-checkbox-checked-ink-color, var(--primary-color));
  }

  #checkbox {
    position: relative;
    box-sizing: border-box;
    height: 100%;
    border: solid 2px;
    border-color: var(--paper-checkbox-unchecked-color, var(--primary-text-color));
    border-radius: 2px;
    pointer-events: none;
    -webkit-transition: background-color 140ms, border-color 140ms;
    transition: background-color 140ms, border-color 140ms;

    -webkit-transition-duration: var(--paper-checkbox-animation-duration, 140ms);
    transition-duration: var(--paper-checkbox-animation-duration, 140ms);
  }

  /* checkbox checked animations */
  #checkbox.checked #checkmark {
    -webkit-animation: checkmark-expand 140ms ease-out forwards;
    animation: checkmark-expand 140ms ease-out forwards;

    -webkit-animation-duration: var(--paper-checkbox-animation-duration, 140ms);
    animation-duration: var(--paper-checkbox-animation-duration, 140ms);
  }

  @-webkit-keyframes checkmark-expand {
    0% {
      -webkit-transform: scale(0, 0) rotate(45deg);
    }
    100% {
      -webkit-transform: scale(1, 1) rotate(45deg);
    }
  }

  @keyframes checkmark-expand {
    0% {
      transform: scale(0, 0) rotate(45deg);
    }
    100% {
      transform: scale(1, 1) rotate(45deg);
    }
  }

  #checkbox.checked {
    background-color: var(--paper-checkbox-checked-color, var(--primary-color));
    border-color: var(--paper-checkbox-checked-color, var(--primary-color));
  }

  #checkmark {
    position: absolute;
    width: 36%;
    height: 70%;
    border-style: solid;
    border-top: none;
    border-left: none;
    border-right-width: calc(2/15 * var(--calculated-paper-checkbox-size));
    border-bottom-width: calc(2/15 * var(--calculated-paper-checkbox-size));
    border-color: var(--paper-checkbox-checkmark-color, white);
    -webkit-transform-origin: 97% 86%;
    transform-origin: 97% 86%;
    box-sizing: content-box; /* protect against page-level box-sizing */
  }

  #checkmark:dir(rtl) {
    -webkit-transform-origin: 50% 14%;
    transform-origin: 50% 14%;
  }

  /* label */
  #checkboxLabel {
    position: relative;
    display: inline-block;
    vertical-align: middle;
    padding-left: var(--paper-checkbox-label-spacing, 8px);
    white-space: normal;
    line-height: normal;
    color: var(--paper-checkbox-label-color, var(--primary-text-color));
    @apply --paper-checkbox-label;
  }

  :host([checked]) #checkboxLabel {
    color: var(--paper-checkbox-label-checked-color, var(--paper-checkbox-label-color, var(--primary-text-color)));
    @apply --paper-checkbox-label-checked;
  }

  #checkboxLabel:dir(rtl) {
    padding-right: var(--paper-checkbox-label-spacing, 8px);
    padding-left: 0;
  }

  #checkboxLabel[hidden] {
    display: none;
  }

  /* disabled state */

  :host([disabled]) #checkbox {
    opacity: 0.5;
    border-color: var(--paper-checkbox-unchecked-color, var(--primary-text-color));
  }

  :host([disabled][checked]) #checkbox {
    background-color: var(--paper-checkbox-unchecked-color, var(--primary-text-color));
    opacity: 0.5;
  }

  :host([disabled]) #checkboxLabel  {
    opacity: 0.65;
  }

  /* invalid state */
  #checkbox.invalid:not(.checked) {
    border-color: var(--paper-checkbox-error-color, var(--error-color));
  }
</style>

<div id="checkboxContainer">
  <div id="checkbox" class$="[[_computeCheckboxClass(checked, invalid)]]">
    <div id="checkmark" class$="[[_computeCheckmarkClass(checked)]]"></div>
  </div>
</div>

<div id="checkboxLabel"><slot></slot></div>`;
template.setAttribute('strip-whitespace', '');

/**
Material design:
[Checkbox](https://www.google.com/design/spec/components/selection-controls.html#selection-controls-checkbox)

`paper-checkbox` is a button that can be either checked or unchecked. User can
tap the checkbox to check or uncheck it. Usually you use checkboxes to allow
user to select multiple options from a set. If you have a single ON/OFF option,
avoid using a single checkbox and use `paper-toggle-button` instead.

Example:

    <paper-checkbox>label</paper-checkbox>

    <paper-checkbox checked> label</paper-checkbox>

### Styling

The following custom properties and mixins are available for styling:

Custom property | Description | Default
----------------|-------------|----------
`--paper-checkbox-unchecked-background-color` | Checkbox background color when the input is not checked | `transparent`
`--paper-checkbox-unchecked-color` | Checkbox border color when the input is not checked | `--primary-text-color`
`--paper-checkbox-unchecked-ink-color` | Selected/focus ripple color when the input is not checked | `--primary-text-color`
`--paper-checkbox-checked-color` | Checkbox color when the input is checked | `--primary-color`
`--paper-checkbox-checked-ink-color` | Selected/focus ripple color when the input is checked | `--primary-color`
`--paper-checkbox-checkmark-color` | Checkmark color | `white`
`--paper-checkbox-label-color` | Label color | `--primary-text-color`
`--paper-checkbox-label-checked-color` | Label color when the input is checked | `--paper-checkbox-label-color`
`--paper-checkbox-label-spacing` | Spacing between the label and the checkbox | `8px`
`--paper-checkbox-label` | Mixin applied to the label | `{}`
`--paper-checkbox-label-checked` | Mixin applied to the label when the input is checked | `{}`
`--paper-checkbox-error-color` | Checkbox color when invalid | `--error-color`
`--paper-checkbox-size` | Size of the checkbox | `18px`
`--paper-checkbox-ink-size` | Size of the ripple | `48px`
`--paper-checkbox-margin` | Margin around the checkbox container | `initial`
`--paper-checkbox-vertical-align` | Vertical alignment of the checkbox container | `middle`

This element applies the mixin `--paper-font-common-base` but does not import
`paper-styles/typography.html`. In order to apply the `Roboto` font to this
element, make sure you've imported `paper-styles/typography.html`.

@demo demo/index.html
*/
Polymer({
  _template: template,

  is: 'paper-checkbox',

  behaviors: [PaperCheckedElementBehavior],

  /** @private */
  hostAttributes: {role: 'checkbox', 'aria-checked': false, tabindex: 0},

  properties: {
    /**
     * Fired when the checked state changes due to user interaction.
     *
     * @event change
     */

    /**
     * Fired when the checked state changes.
     *
     * @event iron-change
     */
    ariaActiveAttribute: {type: String, value: 'aria-checked'}
  },

  attached: function() {
    // Wait until styles have resolved to check for the default sentinel.
    // See polymer#4009 for more details.
    afterNextRender(this, function() {
      var inkSize =
          this.getComputedStyleValue('--calculated-paper-checkbox-ink-size')
              .trim();
      // If unset, compute and set the default `--paper-checkbox-ink-size`.
      if (inkSize === '-1px') {
        var checkboxSizeText =
            this.getComputedStyleValue('--calculated-paper-checkbox-size')
                .trim();

        var units = 'px';
        var unitsMatches = checkboxSizeText.match(/[A-Za-z]+$/);
        if (unitsMatches !== null) {
          units = unitsMatches[0];
        }

        var checkboxSize = parseFloat(checkboxSizeText);
        var defaultInkSize = (8 / 3) * checkboxSize;

        if (units === 'px') {
          defaultInkSize = Math.floor(defaultInkSize);

          // The checkbox and ripple need to have the same parity so that their
          // centers align.
          if (defaultInkSize % 2 !== checkboxSize % 2) {
            defaultInkSize++;
          }
        }

        this.updateStyles({
          '--paper-checkbox-ink-size': defaultInkSize + units,
        });
      }
    });
  },

  _computeCheckboxClass: function(checked, invalid) {
    var className = '';
    if (checked) {
      className += 'checked ';
    }
    if (invalid) {
      className += 'invalid';
    }
    return className;
  },

  _computeCheckmarkClass: function(checked) {
    return checked ? '' : 'hidden';
  },

  // create ripple inside the checkboxContainer
  _createRipple: function() {
    this._rippleContainer = this.$.checkboxContainer;
    return PaperInkyFocusBehaviorImpl._createRipple.call(this);
  }

});

class StorixActions extends i {

  static styles = i$1`

    :host {
      position: fixed;
      bottom: 0%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: var(--primary-color);
      display: flex;
      gap: 0px;
      border-radius: 25px;
      box-shadow:
        0 1px 1px hsl(0deg 0% 0% / 0.075),
        0 2px 2px hsl(0deg 0% 0% / 0.075);
      overflow: hidden;
    }

  `;

  render () {
    return x`
      <slot name="content"></slot>
    `
  }

}

customElements.define('storix-actions', StorixActions);

class StorixPhotos extends i {

  static styles = i$1`
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
      gap: var(--space-2);

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
      /* a year with very few photos still needs a comfortable hover/click
         target: this is the hit area, separate from the visual tick below
         (::before), which stays thin/proportional to the photo count */
      min-height: 12px;
      padding: 2px 0;
      box-sizing: content-box;
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

    .month-flyout {
      position: absolute;
      top: 50%;
      right: 22px;
      transform: translateY(-50%);
      background-color: var(--surface-color, #fff);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      padding: var(--space-2);
      z-index: 4;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 56px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .month-flyout-year {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-color-muted);
      text-align: center;
      margin: 0 0 var(--space-1) 0;
      padding-bottom: var(--space-1);
      border-bottom: 1px solid var(--border-color);
    }

    .month-flyout ul {
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .month-flyout li {
      list-style: none;
      padding: 4px var(--space-2);
      border-radius: var(--radius-sm);
      font-size: 13px;
      text-align: center;
      white-space: nowrap;
      cursor: pointer;
      color: var(--text-color);
      transition: 120ms ease-in-out all;
    }

    .month-flyout li:hover,
    .month-flyout li.active {
      background-color: var(--primary-color);
      color: #fff;
    }

    ul > li {
      position: relative;
      grid-column: span 3;
      grid-row: span 4;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border-radius: var(--radius-sm);
    }

    .image-container {
      box-shadow: var(--shadow-sm);
      background-color: #e2e2e6;
      cursor: pointer;
      transition: 150ms ease-in-out box-shadow;
    }

    .image-container:hover {
      box-shadow: var(--shadow-md);
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
      border-radius: var(--radius-sm);
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
      font-size: 26px;
      font-weight: 500;
      padding: 0px;
      margin: 0;
      padding-top: var(--space-5);
      color: var(--text-color);
    }

    .day-title {
      font-size: 16px;
      font-weight: normal;
      padding: 0px;
      margin: 0;
      padding-top: var(--space-3);
      color: var(--text-color-muted);
    }

    .sticky-header {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 2;
      padding: 6px 14px;
      border-radius: 999px;
      background-color: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(6px);
      box-shadow: var(--shadow-sm);
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color);
      pointer-events: none;
      opacity: 0;
      transform: translateY(-6px);
      transition: 180ms ease-in-out opacity, 180ms ease-in-out transform;
    }

    .sticky-header.visible {
      opacity: 1;
      transform: translateY(0);
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
      type: Array
    },
    _activeYear: {
      type: Number
    },
    _activeMonth: {
      type: Number
    },
    // ... which year's month flyout is open; toggled by click (not hover), so
    // it doesn't disappear while the pointer travels the gap between the
    // (very thin) year marker and the flyout itself ...
    _openYear: {
      type: Number
    },
    _stickyLabel: {
      type: String
    }
  }

  constructor () {
    super();
    this.items = new Array();
    this.selectedItems = new Array();
    this._yearCounts = new Array();
    this._activeYear = null;
    this._activeMonth = null;
    this._openYear = null;
    this._stickyLabel = '';

    app.photos = this.items;
  }

  render () {
    return x`
      <div class="sticky-header ${this._stickyLabel ? 'visible' : ''}">${this._stickyLabel}</div>
      <ul class="files-list" id="files-list" @scroll=${this.onScroll.bind(this)}>
        ${c(this.items, (item) => item.key || item.uuid, this.renderItem.bind(this))}
      </ul>
      ${this.items.length == 0 ? this.renderEmptyList() : ''}
      ${this._yearCounts.length > 0 ? this.renderYearScrubber() : ''}
    `
  }

  firstUpdated () {

    this.list = this.shadowRoot.getElementById('files-list');
    this._observedSentinels = new WeakSet();
    this._observedAnchors = new WeakSet();
    this._loadedPages = new Set();
    this._loadingPages = new Set();

    // ... virtualization state: pages that are loaded but far from the
    // viewport get their real DOM collapsed back to lightweight placeholders
    // (same length, so scroll height never jumps); the real entries stay
    // cached in memory so scrolling back is instant, with no re-fetch ...
    this._collapsedPages = new Set();
    this._pageEntriesCache = new Map();
    this._hotPages = new Set();

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

    // ... tracks which loaded pages are actually near the viewport right now
    // (the "hot" window), mirroring how a virtualized grid (e.g. Vaadin Grid)
    // only keeps a bounded number of rows mounted at any time ...
    this._hotObserver = new IntersectionObserver((entries) => {
      let changed = false;
      for ( const entry of entries ) {
        const page = Number(entry.target.dataset.page);
        if ( entry.isIntersecting ) {
          if ( !this._hotPages.has(page) ) { this._hotPages.add(page); changed = true; }
        } else {
          if ( this._hotPages.has(page) ) { this._hotPages.delete(page); changed = true; }
        }
      }
      if ( changed ) this._reconcileVirtualization();
    }, { root: this.list, rootMargin: '600px 0px 600px 0px', threshold: 0 });

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
    app.photosTotal = total;

    for ( let page = 1; page <= this._totalPages; page++ ) {
      const countInPage = Math.min(100, total - (page - 1) * 100);
      for ( let i = 0; i < countInPage; i++ ) {
        this.items.push({ placeholder: true, page, sentinel: i === 0, anchor: i === 0, key: `ph-${page}-${i}` });
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

    const anchors = this.list.querySelectorAll('[data-page-anchor="1"]');
    for ( const el of anchors ) {
      if ( this._observedAnchors.has(el) ) continue;
      this._observedAnchors.add(el);
      this._hotObserver.observe(el);
    }

  }

  async _fetchPageRaw (page) {
    const result = await app.broker.get('files?filter[p_photos]=true&page=' + page);
    return result.data;
  }

  async fetchYearCounts () {
    const result = await app.broker.get('files?filter[p_photos]=true&aggregate=years');
    this._yearCounts = result.data.map((row) => ({
      year: Number(row.year),
      count: Number(row.count),
      months: (row.months || []).map((m) => ({ month: Number(m.month), count: Number(m.count) }))
    }));
  }

  async _loadPage (page) {

    // ... page was loaded before but its DOM got collapsed for being far from
    // the viewport - restore it from the in-memory cache, no network needed ...
    if ( this._collapsedPages.has(page) ) {
      this._expandPage(page);
      await this.updateComplete;
      this._attachPageObservers();
      return;
    }

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

    const entries = this._buildPageEntries(startIndex, rawItems, page);
    this._pageEntriesCache.set(page, entries);
    this.items.splice(startIndex, endIndex - startIndex, ...entries);
    this.requestUpdate();
    await this.updateComplete;

    this._attachPageObservers();
    this._updateActiveYearFromScroll();

  }

  // ... turns a raw page of files into { separator } + file entries, using
  // whatever real item is already loaded right before this page (if any) to
  // avoid repeating its month/day separator ...
  _buildPageEntries (startIndex, rawItems, page) {

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
        entries.push({ separator: true, month: date_month, page, key: `sep-m-${date_month}` });
        prevMonth = date_month;
      }

      if ( prevDay !== date_day ) {
        entries.push({ separator: true, day: date_day, page, key: `sep-d-${date_day}` });
        prevDay = date_day;
      }

      entries.push({ ...item, page });
    }

    if ( entries.length > 0 ) entries[0].anchor = true;

    return entries;

  }

  // ... keeps only a bounded window of pages mounted in the DOM (the
  // currently "hot" pages plus one page of margin on each side) - anything
  // further away gets collapsed back to placeholders of identical length, so
  // scroll height never changes; anything that re-enters the window is
  // restored from `_pageEntriesCache` instantly, with no re-fetch. This
  // mirrors how virtualized grids (e.g. Vaadin Grid) recycle rows instead of
  // keeping every row mounted forever ...
  _reconcileVirtualization () {

    if ( this._hotPages.size === 0 ) return;

    const minHot = Math.min(...this._hotPages);
    const maxHot = Math.max(...this._hotPages);
    const keepFrom = minHot - 1;
    const keepTo = maxHot + 1;

    for ( const page of this._loadedPages ) {
      const shouldCollapse = page < keepFrom || page > keepTo;
      if ( shouldCollapse ) {
        this._collapsePage(page);
      } else if ( this._collapsedPages.has(page) ) {
        this._expandPage(page);
      }
    }

    this.requestUpdate();

  }

  // ... the anchor element being replaced is about to be detached from the
  // DOM - stop observing it explicitly so the hot-observer doesn't keep
  // piling up references to detached nodes over a long scroll session ...
  _forgetAnchor (page) {

    if ( !this.list ) return;

    const oldAnchor = this.list.querySelector(`[data-page="${page}"][data-page-anchor="1"]`);
    if ( oldAnchor ) {
      this._hotObserver.unobserve(oldAnchor);
      this._observedAnchors.delete(oldAnchor);
    }

  }

  _collapsePage (page) {

    if ( this._collapsedPages.has(page) ) return;

    const startIndex = this.items.findIndex((it) => it.page === page);
    if ( startIndex === -1 ) return;

    let endIndex = startIndex;
    while ( endIndex < this.items.length && this.items[endIndex].page === page ) endIndex++;

    this._forgetAnchor(page);

    const length = endIndex - startIndex;
    const placeholders = [];
    for ( let i = 0; i < length; i++ ) {
      placeholders.push({ placeholder: true, page, sentinel: i === 0, anchor: i === 0, key: `ph-${page}-${i}` });
    }

    this.items.splice(startIndex, length, ...placeholders);
    this._collapsedPages.add(page);

  }

  _expandPage (page) {

    const cached = this._pageEntriesCache.get(page);
    if ( !cached ) return;

    const startIndex = this.items.findIndex((it) => it.placeholder && it.page === page);
    if ( startIndex === -1 ) return;

    let endIndex = startIndex;
    while ( endIndex < this.items.length && this.items[endIndex].placeholder && this.items[endIndex].page === page ) {
      endIndex++;
    }

    this._forgetAnchor(page);

    this.items.splice(startIndex, endIndex - startIndex, ...cached);
    this._collapsedPages.delete(page);

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

  async _jumpToMonth (year, month) {

    const yearBucket = this._yearCounts.find((y) => y.year === year);
    if ( !yearBucket ) {
      console.warn('_jumpToMonth: no year bucket found for', year, this._yearCounts);
      return;
    }

    // ... how many photos exist in years newer than this one, plus months
    // newer than this one within the same year (months are DESC = newest
    // first, same convention as the year list) ...
    const offsetFromNewerYears = this._yearCounts
      .filter((y) => y.year > year)
      .reduce((sum, y) => sum + y.count, 0);

    const offsetFromNewerMonths = yearBucket.months
      .filter((m) => m.month > month)
      .reduce((sum, m) => sum + m.count, 0);

    const targetPage = Math.floor((offsetFromNewerYears + offsetFromNewerMonths) / 100) + 1;

    this._activeYear = year;
    this._activeMonth = month;
    this._openYear = null; // ... close the flyout, the pick is done ...

    await this._loadPage(targetPage);
    this._scrollToMonth(year, month);

  }

  _scrollToMonth (year, month) {

    if ( !this.list ) return;

    const key = `${year}-${month.toString().padStart(2, '0')}`;
    const separator = this.list.querySelector(`li.separator[data-month-key="${key}"]`);
    if ( separator ) {
      this.list.scrollTop = separator.offsetTop;
    } else {
      // ... that month's page hasn't rendered its separator yet (edge case
      // right after loading) - landing on the year is still useful ...
      this._scrollToYear(year);
    }

  }

  // ... finds the month separator currently scrolled just past the top of
  // the viewport, and uses it both to highlight the active year on the
  // scrubber and to show a Google Photos-style sticky "Month Year" label ...
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

    if ( !closest ) {
      this._stickyLabel = '';
      return;
    }

    const year = Number(closest.dataset.year);
    if ( !Number.isNaN(year) && year !== this._activeYear ) {
      this._activeYear = year;
    }

    const monthKey = closest.dataset.monthKey || '';
    const monthNum = monthKey ? Number(monthKey.split('-')[1]) : NaN;
    if ( !Number.isNaN(monthNum) && monthNum !== this._activeMonth ) {
      this._activeMonth = monthNum;
    }

    this._stickyLabel = closest.dataset.monthLabel || '';

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
      return x`
        <li class="image-container placeholder" data-page=${item.page} data-sentinel=${item.sentinel ? '1' : '0'} data-page-anchor=${item.anchor ? '1' : '0'}></li>
      `;
    }

    if ( item.separator === true ) {
      const month_date = item.month ? new Date(item.month) : null;
      const day_date   = item.day ? new Date(item.day) : null;
      const monthLabel = month_date ? `${StorixText.months[month_date.getMonth()]} ${month_date.getFullYear()}` : '';
      const monthKey = month_date ? `${month_date.getFullYear()}-${(month_date.getMonth() + 1).toString().padStart(2, '0')}` : '';
      return x`
        <li class="separator" data-page=${item.page} data-page-anchor=${item.anchor ? '1' : '0'} data-year=${month_date ? month_date.getFullYear() : ''} data-month-key=${monthKey} data-month-label=${monthLabel}>
          ${ month_date ? x`<p class="month-title">${monthLabel}</p>` : '' }
          ${ day_date   ? x`<p class="day-title">${StorixText.days[day_date.getDay()]}, ${day_date.getDate().toString().padStart(2, 0)}/${(day_date.getMonth() + 1).toString().padStart(2, 0)}</p>` : '' }
        </li>
      `;
    } else {
      return x`
        <li class="image-container" data-page=${item.page} data-page-anchor=${item.anchor ? '1' : '0'} @click=${this._showPreview.bind(this)} .item=${item} @error=${(e) => console.log(e) }>
          <paper-checkbox @click=${(e) => e.stopPropagation()} @change=${this._selectItemChange.bind(this)}></paper-checkbox>
          <img src="/api/download?uuid=${item.uuid}&filter[thumbnail]=true" alt="${item.description}" uuid=${item.uuid} loading="lazy" @load=${this._onImageLoad.bind(this)}/>
          ${item.type === 'video' ? x`<div class="video-container"><storix-icon class="video-camera-icon" icon="video-camera"></storix-icon></div>` : ''}
        </li>
      `;
    }

  }

  renderEmptyList () {
    return x`
      <div class="empty-container">
        <storix-icon class="icon-empty" icon="empty-list"></storix-icon>
        <p>Don't exist nothing to show. Uplaod your files</p>
      </div>
    `
  }

  renderYearScrubber () {
    return x`
      <div class="year-scrubber">
        ${this._yearCounts.map((y) => x`
          <div
            class="year-marker ${this._activeYear === y.year ? 'active' : ''}"
            style="flex-grow: ${y.count}"
            @click=${() => this._onYearMarkerClick(y.year)}
          >
            <span class="year-label">${y.year}</span>
            ${this._openYear === y.year ? this.renderMonthFlyout(y) : ''}
          </div>
        `)}
      </div>
    `
  }

  // ... click (not hover) opens the month flyout: hover was fragile, since the
  // flyout sits with a gap outside the (very thin) year marker and the
  // pointer has to cross dead space to reach it, closing the flyout on the
  // way. clicking the same year again just closes it back ...
  _onYearMarkerClick (year) {
    this._jumpToYear(year);
    this._openYear = (this._openYear === year) ? null : year;
  }

  // ... small popover with the months of one year, shown on hover of its
  // marker on the (otherwise too thin to fit labels) year scrubber; lets the
  // user jump straight to a specific month instead of only a whole year ...
  renderMonthFlyout (yearBucket) {
    return x`
      <div class="month-flyout" @click=${(e) => e.stopPropagation()}>
        <p class="month-flyout-year">${yearBucket.year}</p>
        <ul>
          ${yearBucket.months.map((m) => x`
            <li
              class="${this._activeYear === yearBucket.year && this._activeMonth === m.month ? 'active' : ''}"
              @click=${() => this._jumpToMonth(yearBucket.year, m.month)}
            >
              ${StorixText.months[m.month - 1] ? StorixText.months[m.month - 1].slice(0, 3) : m.month}
            </li>
          `)}
        </ul>
      </div>
    `
  }
}

customElements.define('storix-photos', StorixPhotos);

export { StorixPhotos as default };
