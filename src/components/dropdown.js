import { generateId } from '../utils/id.js';

export class WcDropdown extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'position'];
  }

  constructor() {
    super();
    this._handleTriggerClick = this._handleTriggerClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleClickOutside = this._handleClickOutside.bind(this);
    this._handleItemClick = this._handleItemClick.bind(this);

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
        }

        .trigger {
          display: inline-block;
        }

        .menu {
          position: absolute;
          z-index: 1000;
          min-width: 160px;
          padding: 0.25rem 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          opacity: 0;
          visibility: hidden;
          transform: scale(0.95) translateY(-4px);
          transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;
          transform-origin: top left;
        }

        :host([open]) .menu {
          opacity: 1;
          visibility: visible;
          transform: scale(1) translateY(0);
        }

        /* Positions */
        :host([position="bottom-start"]) .menu,
        :host(:not([position])) .menu {
          top: 100%;
          left: 0;
          margin-top: 0.25rem;
        }

        :host([position="bottom-end"]) .menu {
          top: 100%;
          right: 0;
          margin-top: 0.25rem;
          transform-origin: top right;
        }

        :host([position="top-start"]) .menu {
          bottom: 100%;
          left: 0;
          margin-bottom: 0.25rem;
          transform-origin: bottom left;
        }

        :host([position="top-end"]) .menu {
          bottom: 100%;
          right: 0;
          margin-bottom: 0.25rem;
          transform-origin: bottom right;
        }

        ::slotted([slot="item"]) {
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          color: #1e293b;
          text-decoration: none;
        }

        ::slotted([slot="item"]:hover),
        ::slotted([slot="item"]:focus) {
          background: #f1f5f9;
          outline: none;
        }

        ::slotted([slot="item"][disabled]) {
          opacity: 0.5;
          cursor: not-allowed;
        }

        ::slotted([slot="divider"]) {
          height: 1px;
          margin: 0.25rem 0;
          background: #e2e8f0;
        }
      </style>
      <div class="trigger" part="trigger">
        <slot name="trigger"></slot>
      </div>
      <div class="menu" part="menu" role="menu">
        <slot name="item"></slot>
        <slot name="divider"></slot>
        <slot></slot>
      </div>
    `;

    this._trigger = shadow.querySelector('.trigger');
    this._menu = shadow.querySelector('.menu');
    this._menuId = generateId('dropdown-menu');
  }

  connectedCallback() {
    this._trigger.addEventListener('click', this._handleTriggerClick);
    this.addEventListener('keydown', this._handleKeydown);
    this.addEventListener('click', this._handleItemClick);
  }

  disconnectedCallback() {
    this._trigger.removeEventListener('click', this._handleTriggerClick);
    this.removeEventListener('keydown', this._handleKeydown);
    this.removeEventListener('click', this._handleItemClick);
    document.removeEventListener('click', this._handleClickOutside);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') {
      if (newValue !== null) {
        document.addEventListener('click', this._handleClickOutside);
        this._focusFirstItem();
      } else {
        document.removeEventListener('click', this._handleClickOutside);
      }
    }
  }

  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    if (value) {
      this.setAttribute('open', '');
    } else {
      this.removeAttribute('open');
    }
  }

  get position() {
    return this.getAttribute('position') || 'bottom-start';
  }

  set position(value) {
    this.setAttribute('position', value);
  }

  show() {
    this.open = true;
    this.dispatchEvent(new CustomEvent('open', { bubbles: true }));
  }

  hide() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
  }

  toggle() {
    if (this.open) {
      this.hide();
    } else {
      this.show();
    }
  }

  _handleTriggerClick(e) {
    e.stopPropagation();
    this.toggle();
  }

  _handleClickOutside(e) {
    if (!this.contains(e.target)) {
      this.hide();
    }
  }

  _handleItemClick(e) {
    const item = e.target.closest('[slot="item"]');
    if (item && !item.hasAttribute('disabled')) {
      this.dispatchEvent(new CustomEvent('select', { 
        bubbles: true, 
        detail: { item } 
      }));
      this.hide();
    }
  }

  _handleKeydown(e) {
    if (!this.open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.show();
      }
      return;
    }

    const items = this._getItems();
    const currentIndex = items.indexOf(document.activeElement);

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.hide();
        this._trigger.querySelector('[slot="trigger"]')?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < items.length - 1) {
          items[currentIndex + 1].focus();
        } else {
          items[0]?.focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          items[currentIndex - 1].focus();
        } else {
          items[items.length - 1]?.focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
    }
  }

  _getItems() {
    return Array.from(this.querySelectorAll('[slot="item"]:not([disabled])'));
  }

  _focusFirstItem() {
    requestAnimationFrame(() => {
      const items = this._getItems();
      items[0]?.focus();
    });
  }
}

export function defineWcDropdown() {
  if (!customElements.get('wc-dropdown')) {
    customElements.define('wc-dropdown', WcDropdown);
  }
}
