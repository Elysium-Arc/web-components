import { generateId } from '../utils/id.js';

export class WcTooltip extends HTMLElement {
  static get observedAttributes() {
    return ['position', 'delay', 'visible'];
  }

  constructor() {
    super();
    this._showTimeout = null;
    this._hideTimeout = null;
    this._handleMouseEnter = this._handleMouseEnter.bind(this);
    this._handleMouseLeave = this._handleMouseLeave.bind(this);
    this._handleFocus = this._handleFocus.bind(this);
    this._handleBlur = this._handleBlur.bind(this);
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

        .tooltip {
          position: fixed;
          z-index: 99999;
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

        /* Arrow positions - set via data attribute */
        .tooltip[data-arrow="top"]::after {
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-top-color: #1e293b;
        }

        .tooltip[data-arrow="bottom"]::after {
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-bottom-color: #1e293b;
        }

        .tooltip[data-arrow="left"]::after {
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-left-color: #1e293b;
        }

        .tooltip[data-arrow="right"]::after {
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

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'visible') {
      if (newValue !== null) {
        this._updatePosition();
      }
    }
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

  _updatePosition() {
    const triggerEl = this._trigger;
    const tooltipEl = this._tooltip;
    const rect = triggerEl.getBoundingClientRect();
    let position = this.position;
    const gap = 8;
    const padding = 8; // Viewport padding

    // Temporarily show tooltip to measure
    const origVisibility = tooltipEl.style.visibility;
    const origOpacity = tooltipEl.style.opacity;
    tooltipEl.style.visibility = 'hidden';
    tooltipEl.style.opacity = '0';
    tooltipEl.style.display = 'block';
    
    const tooltipRect = tooltipEl.getBoundingClientRect();
    
    tooltipEl.style.visibility = origVisibility;
    tooltipEl.style.opacity = origOpacity;
    tooltipEl.style.display = '';

    // Smart positioning: flip if not enough space
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check if preferred position fits, otherwise flip
    if (position === 'top' && rect.top - tooltipRect.height - gap < padding) {
      position = 'bottom';
    } else if (position === 'bottom' && rect.bottom + tooltipRect.height + gap > viewportHeight - padding) {
      position = 'top';
    } else if (position === 'left' && rect.left - tooltipRect.width - gap < padding) {
      position = 'right';
    } else if (position === 'right' && rect.right + tooltipRect.width + gap > viewportWidth - padding) {
      position = 'left';
    }

    let top, left;

    if (position === 'top') {
      top = rect.top - tooltipRect.height - gap;
      left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    } else if (position === 'bottom') {
      top = rect.bottom + gap;
      left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    } else if (position === 'left') {
      top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
      left = rect.left - tooltipRect.width - gap;
    } else if (position === 'right') {
      top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
      left = rect.right + gap;
    }

    // Clamp to viewport edges
    left = Math.max(padding, Math.min(left, viewportWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipRect.height - padding));

    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
    tooltipEl.setAttribute('data-arrow', position);
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
