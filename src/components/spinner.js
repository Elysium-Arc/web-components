export class WcSpinner extends HTMLElement {
  static get observedAttributes() {
    return ['size', 'variant'];
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
        }

        .spinner {
          width: 1.5rem;
          height: 1.5rem;
          border: 2px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 9999px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Sizes */
        :host([size="xs"]) .spinner {
          width: 0.75rem;
          height: 0.75rem;
          border-width: 1.5px;
        }

        :host([size="sm"]) .spinner {
          width: 1rem;
          height: 1rem;
          border-width: 1.5px;
        }

        :host([size="lg"]) .spinner {
          width: 2rem;
          height: 2rem;
          border-width: 3px;
        }

        :host([size="xl"]) .spinner {
          width: 3rem;
          height: 3rem;
          border-width: 4px;
        }

        /* Variants */
        :host([variant="primary"]) .spinner {
          border-top-color: #3b82f6;
        }

        :host([variant="secondary"]) .spinner {
          border-top-color: #64748b;
        }

        :host([variant="success"]) .spinner {
          border-top-color: #22c55e;
        }

        :host([variant="error"]) .spinner {
          border-top-color: #ef4444;
        }

        :host([variant="white"]) .spinner {
          border-color: rgba(255, 255, 255, 0.3);
          border-top-color: white;
        }

        /* Full overlay mode */
        :host([overlay]) {
          position: fixed;
          inset: 0;
          background: rgba(255, 255, 255, 0.8);
          z-index: 9999;
        }
      </style>
      <div class="spinner" part="spinner" role="status" aria-label="Loading">
        <span style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;">
          <slot>Loading...</slot>
        </span>
      </div>
    `;
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

  get variant() {
    return this.getAttribute('variant') || 'primary';
  }

  set variant(val) {
    this.setAttribute('variant', val);
  }

  get overlay() {
    return this.hasAttribute('overlay');
  }

  set overlay(val) {
    if (val) {
      this.setAttribute('overlay', '');
    } else {
      this.removeAttribute('overlay');
    }
  }
}

export function defineWcSpinner() {
  if (!customElements.get('wc-spinner')) {
    customElements.define('wc-spinner', WcSpinner);
  }
}
