export class WcSkeleton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'width', 'height', 'animation'];
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .skeleton {
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        :host([animation="pulse"]) .skeleton {
          background: #e2e8f0;
          animation: pulse 2s ease-in-out infinite;
        }

        :host([animation="none"]) .skeleton {
          background: #e2e8f0;
          animation: none;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Text variant */
        :host([variant="text"]) .skeleton {
          width: 100%;
          height: 1em;
          border-radius: 0.25rem;
        }

        /* Circular variant */
        :host([variant="circle"]) .skeleton {
          width: 3rem;
          height: 3rem;
          border-radius: 9999px;
        }

        /* Rectangular variant (default) */
        :host([variant="rect"]) .skeleton,
        :host(:not([variant])) .skeleton {
          width: 100%;
          height: 100px;
          border-radius: 0.5rem;
        }

        /* Card variant */
        :host([variant="card"]) .skeleton {
          width: 100%;
          height: 200px;
          border-radius: 0.5rem;
        }

        /* Avatar variant */
        :host([variant="avatar"]) .skeleton {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 9999px;
        }

        /* Button variant */
        :host([variant="button"]) .skeleton {
          width: 80px;
          height: 2.25rem;
          border-radius: 0.375rem;
        }
      </style>
      <div class="skeleton" part="skeleton" aria-hidden="true"></div>
    `;

    this._skeleton = shadow.querySelector('.skeleton');
  }

  connectedCallback() {
    this._updateDimensions();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'width' || name === 'height') {
      this._updateDimensions();
    }
  }

  get variant() {
    return this.getAttribute('variant') || 'rect';
  }

  set variant(val) {
    this.setAttribute('variant', val);
  }

  get width() {
    return this.getAttribute('width');
  }

  set width(val) {
    if (val) {
      this.setAttribute('width', val);
    } else {
      this.removeAttribute('width');
    }
  }

  get height() {
    return this.getAttribute('height');
  }

  set height(val) {
    if (val) {
      this.setAttribute('height', val);
    } else {
      this.removeAttribute('height');
    }
  }

  _updateDimensions() {
    if (this.width) {
      this._skeleton.style.width = this.width;
    }
    if (this.height) {
      this._skeleton.style.height = this.height;
    }
  }
}

export function defineWcSkeleton() {
  if (!customElements.get('wc-skeleton')) {
    customElements.define('wc-skeleton', WcSkeleton);
  }
}
