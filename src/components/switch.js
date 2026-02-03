import { generateId } from '../utils/id.js';

export class WcSwitch extends HTMLElement {
  static get observedAttributes() {
    return ['checked', 'disabled', 'name', 'value'];
  }

  static get formAssociated() {
    return true;
  }

  constructor() {
    super();
    this._internals = this.attachInternals?.() || null;
    this._handleClick = this._handleClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        :host([disabled]) {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .switch {
          position: relative;
          width: 2.75rem;
          height: 1.5rem;
          background: #cbd5e1;
          border-radius: 9999px;
          transition: background-color 0.2s ease;
        }

        :host([checked]) .switch {
          background: #3b82f6;
        }

        .thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 1.25rem;
          height: 1.25rem;
          background: white;
          border-radius: 9999px;
          box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
          transition: transform 0.2s ease;
        }

        :host([checked]) .thumb {
          transform: translateX(1.25rem);
        }

        .switch:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .label {
          font-size: 0.875rem;
          color: #1e293b;
          user-select: none;
        }
      </style>
      <div class="switch" part="switch" role="switch" tabindex="0" aria-checked="false">
        <div class="thumb" part="thumb"></div>
      </div>
      <span class="label" part="label">
        <slot></slot>
      </span>
    `;

    this._switch = shadow.querySelector('.switch');
    this._inputId = generateId('switch');
  }

  connectedCallback() {
    this._switch.addEventListener('click', this._handleClick);
    this._switch.addEventListener('keydown', this._handleKeydown);
    this._updateAriaChecked();
    this._updateFormValue();
  }

  disconnectedCallback() {
    this._switch.removeEventListener('click', this._handleClick);
    this._switch.removeEventListener('keydown', this._handleKeydown);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'checked') {
      this._updateAriaChecked();
      this._updateFormValue();
    }
    if (name === 'disabled') {
      this._switch.setAttribute('tabindex', newValue !== null ? '-1' : '0');
    }
  }

  get checked() {
    return this.hasAttribute('checked');
  }

  set checked(value) {
    if (value) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  get name() {
    return this.getAttribute('name') || '';
  }

  set name(value) {
    this.setAttribute('name', value);
  }

  get value() {
    return this.getAttribute('value') || 'on';
  }

  set value(val) {
    this.setAttribute('value', val);
  }

  toggle() {
    if (!this.disabled) {
      this.checked = !this.checked;
      this.dispatchEvent(new CustomEvent('change', { 
        bubbles: true, 
        detail: { checked: this.checked } 
      }));
    }
  }

  _handleClick(e) {
    e.preventDefault();
    this.toggle();
  }

  _handleKeydown(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    }
  }

  _updateAriaChecked() {
    this._switch.setAttribute('aria-checked', String(this.checked));
  }

  _updateFormValue() {
    if (this._internals) {
      this._internals.setFormValue(this.checked ? this.value : null);
    }
  }

  // Form-associated custom element methods
  formResetCallback() {
    this.checked = this.hasAttribute('checked');
  }

  formStateRestoreCallback(state) {
    this.checked = state === this.value;
  }
}

export function defineWcSwitch() {
  if (!customElements.get('wc-switch')) {
    customElements.define('wc-switch', WcSwitch);
  }
}
