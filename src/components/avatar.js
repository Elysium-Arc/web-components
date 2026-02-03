export class WcAvatar extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'alt', 'size', 'fallback'];
  }

  constructor() {
    super();
    this._handleError = this._handleError.bind(this);

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 9999px;
          background: #e2e8f0;
          color: #64748b;
          font-weight: 500;
          font-size: 1rem;
          overflow: hidden;
          vertical-align: middle;
        }

        /* Sizes */
        :host([size="xs"]) {
          width: 1.5rem;
          height: 1.5rem;
          font-size: 0.625rem;
        }

        :host([size="sm"]) {
          width: 2rem;
          height: 2rem;
          font-size: 0.75rem;
        }

        :host([size="lg"]) {
          width: 3rem;
          height: 3rem;
          font-size: 1.25rem;
        }

        :host([size="xl"]) {
          width: 4rem;
          height: 4rem;
          font-size: 1.5rem;
        }

        :host([size="2xl"]) {
          width: 5rem;
          height: 5rem;
          font-size: 2rem;
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          text-transform: uppercase;
        }

        /* Fallback icon */
        .fallback-icon {
          width: 60%;
          height: 60%;
          color: currentColor;
        }
      </style>
      <img part="image" hidden>
      <div class="fallback" part="fallback">
        <slot>
          <svg class="fallback-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </slot>
      </div>
    `;

    this._img = shadow.querySelector('img');
    this._fallback = shadow.querySelector('.fallback');
  }

  connectedCallback() {
    this._img.addEventListener('error', this._handleError);
    this._updateImage();
  }

  disconnectedCallback() {
    this._img.removeEventListener('error', this._handleError);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src' || name === 'alt' || name === 'fallback') {
      this._updateImage();
    }
  }

  get src() {
    return this.getAttribute('src');
  }

  set src(val) {
    if (val) {
      this.setAttribute('src', val);
    } else {
      this.removeAttribute('src');
    }
  }

  get alt() {
    return this.getAttribute('alt') || '';
  }

  set alt(val) {
    this.setAttribute('alt', val);
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

  get fallback() {
    return this.getAttribute('fallback');
  }

  set fallback(val) {
    if (val) {
      this.setAttribute('fallback', val);
    } else {
      this.removeAttribute('fallback');
    }
  }

  _updateImage() {
    const src = this.src;
    const fallbackText = this.fallback;

    if (src) {
      this._img.src = src;
      this._img.alt = this.alt;
      this._img.hidden = false;
      this._fallback.hidden = true;
    } else {
      this._img.hidden = true;
      this._fallback.hidden = false;
      
      // Set fallback initials if provided
      if (fallbackText) {
        this._fallback.textContent = this._getInitials(fallbackText);
      }
    }
  }

  _handleError() {
    this._img.hidden = true;
    this._fallback.hidden = false;
    
    // Show fallback initials if available
    const fallbackText = this.fallback || this.alt;
    if (fallbackText) {
      this._fallback.textContent = this._getInitials(fallbackText);
    }
  }

  _getInitials(name) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}

export function defineWcAvatar() {
  if (!customElements.get('wc-avatar')) {
    customElements.define('wc-avatar', WcAvatar);
  }
}
