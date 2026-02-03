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
    this._updatePosition = this._updatePosition.bind(this);

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
          position: fixed;
          z-index: 9999;
          min-width: 160px;
          padding: 0.25rem 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          opacity: 0;
          visibility: hidden;
          transform: scale(0.95);
          transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;
          pointer-events: none;
        }

        :host([open]) .menu {
          opacity: 1;
          visibility: visible;
          transform: scale(1);
          pointer-events: auto;
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
    window.removeEventListener('scroll', this._updatePosition, true);
    window.removeEventListener('resize', this._updatePosition);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') {
      if (newValue !== null) {
        this._updatePosition();
        document.addEventListener('click', this._handleClickOutside);
        window.addEventListener('scroll', this._updatePosition, true);
        window.addEventListener('resize', this._updatePosition);
        this._focusFirstItem();
      } else {
        document.removeEventListener('click', this._handleClickOutside);
        window.removeEventListener('scroll', this._updatePosition, true);
        window.removeEventListener('resize', this._updatePosition);
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
    // Close other open dropdowns first
    document.querySelectorAll('wc-dropdown[open]').forEach(dropdown => {
      if (dropdown !== this) {
        dropdown.hide();
      }
    });
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

  _updatePosition() {
    const triggerEl = this._trigger;
    const menuEl = this._menu;
    const rect = triggerEl.getBoundingClientRect();
    const position = this.position;
    const gap = 4;

    // Reset transform for measurement
    const isOpen = this.open;
    
    if (position === 'bottom-start' || position === 'bottom') {
      menuEl.style.top = `${rect.bottom + gap}px`;
      menuEl.style.left = `${rect.left}px`;
      menuEl.style.right = 'auto';
      menuEl.style.bottom = 'auto';
      menuEl.style.transformOrigin = 'top left';
    } else if (position === 'bottom-end') {
      menuEl.style.top = `${rect.bottom + gap}px`;
      menuEl.style.right = `${window.innerWidth - rect.right}px`;
      menuEl.style.left = 'auto';
      menuEl.style.bottom = 'auto';
      menuEl.style.transformOrigin = 'top right';
    } else if (position === 'top-start' || position === 'top') {
      menuEl.style.bottom = `${window.innerHeight - rect.top + gap}px`;
      menuEl.style.left = `${rect.left}px`;
      menuEl.style.right = 'auto';
      menuEl.style.top = 'auto';
      menuEl.style.transformOrigin = 'bottom left';
    } else if (position === 'top-end') {
      menuEl.style.bottom = `${window.innerHeight - rect.top + gap}px`;
      menuEl.style.right = `${window.innerWidth - rect.right}px`;
      menuEl.style.left = 'auto';
      menuEl.style.top = 'auto';
      menuEl.style.transformOrigin = 'bottom right';
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
