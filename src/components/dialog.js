import { ensureId } from '../utils/id.js';
import { WcButton } from './button.js';

const DIALOG_STATE_ATTR = 'data-state';

export class WcDialog extends HTMLElement {
  static get observedAttributes() {
    return ['open'];
  }

  constructor() {
    super();
    this._onTriggerClick = this._onTriggerClick.bind(this);
    this._onCloseClick = this._onCloseClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onBackdropClick = this._onBackdropClick.bind(this);
    this._previouslyFocused = null;

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: inline;
        }
        
        .overlay {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 99999;
        }
        
        :host([open]) .overlay {
          display: block;
        }
        
        .backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
        }
        
        .content-wrapper {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
        }
      </style>
      <slot name="trigger"></slot>
      <div class="overlay" part="overlay">
        <div class="backdrop" part="backdrop"></div>
        <div class="content-wrapper" part="content-wrapper">
          <slot name="content"></slot>
        </div>
      </div>
    `;

    this._overlay = shadow.querySelector('.overlay');
    this._backdrop = shadow.querySelector('.backdrop');
    this._contentWrapper = shadow.querySelector('.content-wrapper');
  }

  connectedCallback() {
    this._upgradeProperty('open');
    this._setup();
    this._applyOpenState();
  }

  disconnectedCallback() {
    this._teardown();
  }

  attributeChangedCallback(name) {
    if (name === 'open') {
      this._applyOpenState();
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

  show() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  toggle() {
    this.open = !this.open;
  }

  _upgradeProperty(propertyName) {
    if (Object.prototype.hasOwnProperty.call(this, propertyName)) {
      const value = this[propertyName];
      delete this[propertyName];
      this[propertyName] = value;
    }
  }

  _setup() {
    this._teardown();
    this._trigger = this.querySelector('[slot="trigger"]');
    this._content = this.querySelector('[slot="content"]');
    this._closeButtons = Array.from(this.querySelectorAll('wc-dialog-close'));

    if (this._content) {
      ensureId(this._content, 'wc-dialog-content');
      if (!this._content.hasAttribute('role')) {
        this._content.setAttribute('role', 'dialog');
      }
      if (!this._content.hasAttribute('aria-modal')) {
        this._content.setAttribute('aria-modal', 'true');
      }
      if (!this._content.hasAttribute('tabindex')) {
        this._content.setAttribute('tabindex', '-1');
      }
    }

    if (this._trigger && this._content) {
      this._trigger.setAttribute('aria-controls', this._content.id);
      this._trigger.setAttribute('aria-haspopup', 'dialog');
    }

    if (this._trigger) {
      this._trigger.addEventListener('click', this._onTriggerClick);
    }

    this._backdrop.addEventListener('click', this._onBackdropClick);

    for (const closeButton of this._closeButtons) {
      closeButton.addEventListener('click', this._onCloseClick);
    }

    this.addEventListener('keydown', this._onKeyDown);
  }

  _teardown() {
    if (this._trigger) {
      this._trigger.removeEventListener('click', this._onTriggerClick);
    }
    if (this._backdrop) {
      this._backdrop.removeEventListener('click', this._onBackdropClick);
    }
    if (this._closeButtons) {
      for (const closeButton of this._closeButtons) {
        closeButton.removeEventListener('click', this._onCloseClick);
      }
    }
    this.removeEventListener('keydown', this._onKeyDown);
  }

  _applyOpenState() {
    const isOpen = this.open;
    this.setAttribute(DIALOG_STATE_ATTR, isOpen ? 'open' : 'closed');
    
    if (this._content) {
      this._content.setAttribute(DIALOG_STATE_ATTR, isOpen ? 'open' : 'closed');
    }

    if (this._trigger) {
      this._trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      this._trigger.setAttribute(DIALOG_STATE_ATTR, isOpen ? 'open' : 'closed');
    }

    if (isOpen) {
      this._previouslyFocused = document.activeElement;
      // Focus the content
      requestAnimationFrame(() => {
        if (this._content) {
          this._content.focus();
        }
      });
      this.dispatchEvent(new CustomEvent('dialog-open', { bubbles: true }));
    } else {
      // Return focus
      if (this._previouslyFocused && typeof this._previouslyFocused.focus === 'function') {
        this._previouslyFocused.focus();
      }
      this.dispatchEvent(new CustomEvent('dialog-close', { bubbles: true }));
    }
  }

  _onTriggerClick(event) {
    event.preventDefault();
    this.toggle();
  }

  _onCloseClick(event) {
    event.preventDefault();
    this.close();
  }

  _onKeyDown(event) {
    if (!this.open) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
  }

  _onBackdropClick(event) {
    this.close();
  }
}

export class WcDialogTrigger extends WcButton {}
export class WcDialogClose extends WcButton {}

export function defineWcDialog() {
  if (!customElements.get('wc-dialog')) {
    customElements.define('wc-dialog', WcDialog);
  }
  if (!customElements.get('wc-dialog-trigger')) {
    customElements.define('wc-dialog-trigger', WcDialogTrigger);
  }
  if (!customElements.get('wc-dialog-close')) {
    customElements.define('wc-dialog-close', WcDialogClose);
  }
}
