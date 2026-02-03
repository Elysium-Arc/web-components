export class WcAlert extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'dismissible'];
  }

  constructor() {
    super();
    this._handleClose = this._handleClose.bind(this);

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        :host([hidden]) {
          display: none;
        }

        /* Default / Info variant */
        :host(:not([variant])),
        :host([variant="info"]) {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        }

        :host(:not([variant])) .icon,
        :host([variant="info"]) .icon {
          color: #3b82f6;
        }

        /* Success variant */
        :host([variant="success"]) {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        :host([variant="success"]) .icon {
          color: #22c55e;
        }

        /* Warning variant */
        :host([variant="warning"]) {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
        }

        :host([variant="warning"]) .icon {
          color: #f59e0b;
        }

        /* Error variant */
        :host([variant="error"]) {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        :host([variant="error"]) .icon {
          color: #ef4444;
        }

        .icon {
          flex-shrink: 0;
          width: 1.25rem;
          height: 1.25rem;
        }

        .content {
          flex: 1;
          min-width: 0;
        }

        .title {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .title:empty {
          display: none;
        }

        .close {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          padding: 0;
          margin: -0.25rem -0.25rem -0.25rem 0;
          background: transparent;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.15s;
        }

        .close:hover {
          opacity: 1;
        }

        .close svg {
          width: 1rem;
          height: 1rem;
        }

        :host(:not([dismissible])) .close {
          display: none;
        }

        /* Icon SVGs */
        .icon-info, .icon-success, .icon-warning, .icon-error {
          display: none;
        }

        :host(:not([variant])) .icon-info,
        :host([variant="info"]) .icon-info {
          display: block;
        }

        :host([variant="success"]) .icon-success {
          display: block;
        }

        :host([variant="warning"]) .icon-warning {
          display: block;
        }

        :host([variant="error"]) .icon-error {
          display: block;
        }
      </style>
      <div class="icon" part="icon">
        <svg class="icon-info" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg class="icon-success" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg class="icon-warning" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <svg class="icon-error" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="content" part="content">
        <div class="title" part="title">
          <slot name="title"></slot>
        </div>
        <div class="message" part="message">
          <slot></slot>
        </div>
      </div>
      <button class="close" part="close" aria-label="Dismiss">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;

    this._closeButton = shadow.querySelector('.close');
  }

  connectedCallback() {
    this._closeButton.addEventListener('click', this._handleClose);
  }

  disconnectedCallback() {
    this._closeButton.removeEventListener('click', this._handleClose);
  }

  get variant() {
    return this.getAttribute('variant') || 'info';
  }

  set variant(val) {
    this.setAttribute('variant', val);
  }

  get dismissible() {
    return this.hasAttribute('dismissible');
  }

  set dismissible(val) {
    if (val) {
      this.setAttribute('dismissible', '');
    } else {
      this.removeAttribute('dismissible');
    }
  }

  dismiss() {
    this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true }));
    this.hidden = true;
  }

  _handleClose() {
    this.dismiss();
  }
}

export function defineWcAlert() {
  if (!customElements.get('wc-alert')) {
    customElements.define('wc-alert', WcAlert);
  }
}
