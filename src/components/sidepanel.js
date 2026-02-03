import { trapTabKey, focusFirst } from '../utils/focus.js';

export class WcSidepanel extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'position', 'overlay'];
  }

  constructor() {
    super();
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleTabKey = this._handleTabKey.bind(this);
    this._handleOverlayClick = this._handleOverlayClick.bind(this);
    this._handleClose = this._handleClose.bind(this);
    this._previouslyFocused = null;

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          isolation: isolate;
          position: relative;
          z-index: 9998;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        :host([open]) .overlay {
          opacity: 1;
          visibility: visible;
        }

        :host(:not([overlay])) .overlay,
        :host([overlay="false"]) .overlay {
          display: none;
        }

        .panel {
          position: fixed;
          top: 0;
          bottom: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          width: var(--wc-sidepanel-width, 320px);
          max-width: 100vw;
          background: white;
          box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
        }

        /* Right position (default) */
        :host([position="right"]) .panel,
        :host(:not([position])) .panel {
          right: 0;
          transform: translateX(100%);
        }

        :host([position="right"][open]) .panel,
        :host(:not([position])[open]) .panel {
          transform: translateX(0);
        }

        /* Left position */
        :host([position="left"]) .panel {
          left: 0;
          transform: translateX(-100%);
        }

        :host([position="left"][open]) .panel {
          transform: translateX(0);
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .title {
          font-weight: 600;
          font-size: 1.125rem;
          margin: 0;
        }

        .close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          padding: 0;
          border: none;
          background: transparent;
          border-radius: 0.375rem;
          cursor: pointer;
          color: #64748b;
          transition: background-color 0.15s, color 0.15s;
        }

        .close-button:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .close-button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .close-button svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .body {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .footer {
          padding: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .footer:empty {
          display: none;
        }

        /* Panel visibility with transition delay for close animation */
        .panel {
          visibility: hidden;
          transition: transform 0.3s ease, visibility 0s 0.3s;
        }

        :host([open]) .panel {
          visibility: visible;
          transition: transform 0.3s ease, visibility 0s 0s;
        }
      </style>
      <div class="overlay" part="overlay"></div>
      <div class="panel" part="panel" role="dialog" aria-modal="true" aria-labelledby="sidepanel-title">
        <header class="header" part="header">
          <h2 class="title" part="title" id="sidepanel-title">
            <slot name="title">Panel</slot>
          </h2>
          <button class="close-button" part="close" aria-label="Close panel">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div class="body" part="body">
          <slot></slot>
        </div>
        <footer class="footer" part="footer">
          <slot name="footer"></slot>
        </footer>
      </div>
    `;

    this._overlay = shadow.querySelector('.overlay');
    this._panel = shadow.querySelector('.panel');
    this._closeButton = shadow.querySelector('.close-button');
  }

  connectedCallback() {
    this._closeButton.addEventListener('click', this._handleClose);
    this._overlay.addEventListener('click', this._handleOverlayClick);
    
    // Handle close buttons in slotted content
    this.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) {
        this.close();
      }
    });
  }

  disconnectedCallback() {
    this._closeButton.removeEventListener('click', this._handleClose);
    this._overlay.removeEventListener('click', this._handleOverlayClick);
    document.removeEventListener('keydown', this._handleKeydown);
    releaseFocus(this._panel);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') {
      if (newValue !== null) {
        this._onOpen();
      } else {
        this._onClose();
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
    return this.getAttribute('position') || 'right';
  }

  set position(value) {
    this.setAttribute('position', value);
  }

  get overlay() {
    return this.hasAttribute('overlay') && this.getAttribute('overlay') !== 'false';
  }

  set overlay(value) {
    if (value) {
      this.setAttribute('overlay', '');
    } else {
      this.removeAttribute('overlay');
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

  _onOpen() {
    this._previouslyFocused = document.activeElement;
    document.addEventListener('keydown', this._handleKeydown);
    
    // Prevent body scroll when overlay is shown
    if (this.overlay) {
      document.body.style.overflow = 'hidden';
    }

    // Trap tab key within panel
    document.addEventListener('keydown', this._handleTabKey);

    // Focus the panel after transition
    requestAnimationFrame(() => {
      focusFirst(this._panel) || this._closeButton.focus();
    });

    this.dispatchEvent(new CustomEvent('open', { bubbles: true }));
  }

  _onClose() {
    document.removeEventListener('keydown', this._handleKeydown);
    document.removeEventListener('keydown', this._handleTabKey);
    
    // Restore body scroll
    document.body.style.overflow = '';

    // Restore focus
    if (this._previouslyFocused) {
      this._previouslyFocused.focus();
      this._previouslyFocused = null;
    }

    this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
  }

  _handleKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    }
  }

  _handleTabKey(e) {
    trapTabKey(e, this._panel);
  }

  _handleOverlayClick() {
    this.close();
  }

  _handleClose() {
    this.close();
  }
}

export function defineWcSidepanel() {
  if (!customElements.get('wc-sidepanel')) {
    customElements.define('wc-sidepanel', WcSidepanel);
  }
}
