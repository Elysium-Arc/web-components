export class WcProgress extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'max', 'indeterminate'];
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }

        .label {
          font-weight: 500;
          color: #1e293b;
        }

        .value {
          color: #64748b;
        }

        .track {
          width: 100%;
          height: 0.5rem;
          background: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
        }

        .bar {
          height: 100%;
          background: #3b82f6;
          border-radius: 9999px;
          transition: width 0.3s ease;
        }

        :host([indeterminate]) .bar {
          width: 30% !important;
          animation: indeterminate 1.5s ease-in-out infinite;
        }

        @keyframes indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        /* Size variants */
        :host([size="sm"]) .track {
          height: 0.25rem;
        }

        :host([size="lg"]) .track {
          height: 0.75rem;
        }

        /* Color variants */
        :host([variant="success"]) .bar {
          background: #22c55e;
        }

        :host([variant="warning"]) .bar {
          background: #f59e0b;
        }

        :host([variant="error"]) .bar {
          background: #ef4444;
        }
      </style>
      <div class="container" part="container">
        <div class="header" part="header">
          <span class="label" part="label"><slot></slot></span>
          <span class="value" part="value"></span>
        </div>
        <div class="track" part="track" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
          <div class="bar" part="bar"></div>
        </div>
      </div>
    `;

    this._track = shadow.querySelector('.track');
    this._bar = shadow.querySelector('.bar');
    this._valueDisplay = shadow.querySelector('.value');
    this._header = shadow.querySelector('.header');
  }

  connectedCallback() {
    this._updateProgress();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value' || name === 'max') {
      this._updateProgress();
    }
    if (name === 'indeterminate') {
      this._track.removeAttribute('aria-valuenow');
      this._valueDisplay.textContent = '';
    }
  }

  get value() {
    return parseFloat(this.getAttribute('value')) || 0;
  }

  set value(val) {
    this.setAttribute('value', String(val));
  }

  get max() {
    return parseFloat(this.getAttribute('max')) || 100;
  }

  set max(val) {
    this.setAttribute('max', String(val));
  }

  get indeterminate() {
    return this.hasAttribute('indeterminate');
  }

  set indeterminate(val) {
    if (val) {
      this.setAttribute('indeterminate', '');
    } else {
      this.removeAttribute('indeterminate');
    }
  }

  _updateProgress() {
    if (this.indeterminate) return;

    const percentage = Math.min(100, Math.max(0, (this.value / this.max) * 100));
    this._bar.style.width = `${percentage}%`;
    this._track.setAttribute('aria-valuenow', String(this.value));
    this._track.setAttribute('aria-valuemax', String(this.max));
    
    // Show percentage if there's a label
    if (this.textContent.trim()) {
      this._valueDisplay.textContent = `${Math.round(percentage)}%`;
    }
  }
}

export function defineWcProgress() {
  if (!customElements.get('wc-progress')) {
    customElements.define('wc-progress', WcProgress);
  }
}
