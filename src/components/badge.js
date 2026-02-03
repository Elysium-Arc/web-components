export class WcBadge extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'size', 'dot'];
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.125rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          line-height: 1.4;
          border-radius: 9999px;
          white-space: nowrap;
          vertical-align: middle;
        }

        /* Default variant */
        :host(:not([variant])),
        :host([variant="default"]) {
          background: #f1f5f9;
          color: #475569;
        }

        /* Color variants */
        :host([variant="primary"]) {
          background: #3b82f6;
          color: white;
        }

        :host([variant="secondary"]) {
          background: #64748b;
          color: white;
        }

        :host([variant="success"]) {
          background: #22c55e;
          color: white;
        }

        :host([variant="warning"]) {
          background: #f59e0b;
          color: white;
        }

        :host([variant="error"]) {
          background: #ef4444;
          color: white;
        }

        :host([variant="info"]) {
          background: #0ea5e9;
          color: white;
        }

        /* Outline variants */
        :host([variant="outline"]) {
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #475569;
        }

        :host([variant="outline-primary"]) {
          background: transparent;
          border: 1px solid #3b82f6;
          color: #3b82f6;
        }

        :host([variant="outline-success"]) {
          background: transparent;
          border: 1px solid #22c55e;
          color: #22c55e;
        }

        :host([variant="outline-error"]) {
          background: transparent;
          border: 1px solid #ef4444;
          color: #ef4444;
        }

        /* Size variants */
        :host([size="sm"]) {
          padding: 0 0.375rem;
          font-size: 0.625rem;
        }

        :host([size="lg"]) {
          padding: 0.25rem 0.75rem;
          font-size: 0.875rem;
        }

        /* Dot variant */
        :host([dot]) {
          width: 0.5rem;
          height: 0.5rem;
          padding: 0;
          font-size: 0;
        }

        :host([dot][size="sm"]) {
          width: 0.375rem;
          height: 0.375rem;
        }

        :host([dot][size="lg"]) {
          width: 0.75rem;
          height: 0.75rem;
        }
      </style>
      <slot></slot>
    `;
  }

  get variant() {
    return this.getAttribute('variant') || 'default';
  }

  set variant(val) {
    this.setAttribute('variant', val);
  }

  get size() {
    return this.getAttribute('size');
  }

  set size(val) {
    if (val) {
      this.setAttribute('size', val);
    } else {
      this.removeAttribute('size');
    }
  }

  get dot() {
    return this.hasAttribute('dot');
  }

  set dot(val) {
    if (val) {
      this.setAttribute('dot', '');
    } else {
      this.removeAttribute('dot');
    }
  }
}

export function defineWcBadge() {
  if (!customElements.get('wc-badge')) {
    customElements.define('wc-badge', WcBadge);
  }
}
