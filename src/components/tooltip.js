import { generateId } from '../utils/id.js';

export class WcTooltip extends HTMLElement {
  static get observedAttributes() {
    return ['position', 'delay'];
  }

  constructor() {
    super();
    this._showTimeout = null;
    this._hideTimeout = null;
    this._handleMouseEnter = this._handleMouseEnter.bind(this);
    this._handleMouseLeave = this._handleMouseLeave.bind(this);
    this._handleFocus = this._handleFocus.bind(this);
    this._handleBlur = this._handleBlur.bind(this);

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

        .tooltip {
          position: absolute;
          z-index: 10000;
          padding: 0.5rem 0.75rem;
          background: #1e293b;
          color: white;
          font-size: 0.75rem;
          line-height: 1.4;
          border-radius: 0.375rem;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.15s ease, visibility 0.15s ease;
        }

        :host([visible]) .tooltip {
          opacity: 1;
          visibility: visible;
        }

        /* Arrow */
        .tooltip::after {
          content: '';
          position: absolute;
          border: 5px solid transparent;
        }

        /* Positions */
        :host([position="top"]) .tooltip,
        :host(:not([position])) .tooltip {
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
        }

        :host([position="top"]) .tooltip::after,
        :host(:not([position])) .tooltip::after {
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-top-color: #1e293b;
        }

        :host([position="bottom"]) .tooltip {
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
        }

        :host([position="bottom"]) .tooltip::after {
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-bottom-color: #1e293b;
        }

        :host([position="left"]) .tooltip {
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 8px;
        }

        :host([position="left"]) .tooltip::after {
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-left-color: #1e293b;
        }

        :host([position="right"]) .tooltip {
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-left: 8px;
        }

        :host([position="right"]) .tooltip::after {
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-right-color: #1e293b;
        }
      </style>
      <div class="trigger" part="trigger">
        <slot></slot>
      </div>
      <div class="tooltip" part="tooltip" role="tooltip">
        <slot name="content"></slot>
      </div>
    `;

    this._trigger = shadow.querySelector('.trigger');
    this._tooltip = shadow.querySelector('.tooltip');
    this._tooltipId = generateId('tooltip');
  }

  connectedCallback() {
    this._trigger.addEventListener('mouseenter', this._handleMouseEnter);
    this._trigger.addEventListener('mouseleave', this._handleMouseLeave);
    this._trigger.addEventListener('focusin', this._handleFocus);
    this._trigger.addEventListener('focusout', this._handleBlur);
    
    this._tooltip.setAttribute('id', this._tooltipId);
    const triggerEl = this._trigger.querySelector('*');
    if (triggerEl) {
      triggerEl.setAttribute('aria-describedby', this._tooltipId);
    }
  }

  disconnectedCallback() {
    this._trigger.removeEventListener('mouseenter', this._handleMouseEnter);
    this._trigger.removeEventListener('mouseleave', this._handleMouseLeave);
    this._trigger.removeEventListener('focusin', this._handleFocus);
    this._trigger.removeEventListener('focusout', this._handleBlur);
    this._clearTimeouts();
  }

  get position() {
    return this.getAttribute('position') || 'top';
  }

  set position(value) {
    this.setAttribute('position', value);
  }

  get delay() {
    return parseInt(this.getAttribute('delay')) || 200;
  }

  set delay(value) {
    this.setAttribute('delay', String(value));
  }

  show() {
    this._clearTimeouts();
    this.setAttribute('visible', '');
  }

  hide() {
    this._clearTimeouts();
    this.removeAttribute('visible');
  }

  _handleMouseEnter() {
    this._clearTimeouts();
    this._showTimeout = setTimeout(() => this.show(), this.delay);
  }

  _handleMouseLeave() {
    this._clearTimeouts();
    this._hideTimeout = setTimeout(() => this.hide(), 100);
  }

  _handleFocus() {
    this.show();
  }

  _handleBlur() {
    this.hide();
  }

  _clearTimeouts() {
    if (this._showTimeout) {
      clearTimeout(this._showTimeout);
      this._showTimeout = null;
    }
    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }
  }
}

export function defineWcTooltip() {
  if (!customElements.get('wc-tooltip')) {
    customElements.define('wc-tooltip', WcTooltip);
  }
}
