export class WcButton extends HTMLElement {
  static get observedAttributes() {
    return ['disabled'];
  }

  constructor() {
    super();
    this._onClick = this._onClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._spaceDown = false;
  }

  connectedCallback() {
    this._upgradeProperty('disabled');
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'button');
    }
    this._syncState();
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeyDown);
    this.addEventListener('keyup', this._onKeyUp);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKeyDown);
    this.removeEventListener('keyup', this._onKeyUp);
  }

  attributeChangedCallback(name) {
    if (name === 'disabled') {
      this._syncState();
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  _upgradeProperty(propertyName) {
    if (Object.prototype.hasOwnProperty.call(this, propertyName)) {
      const value = this[propertyName];
      delete this[propertyName];
      this[propertyName] = value;
    }
  }

  _syncState() {
    const isDisabled = this.disabled;
    if (isDisabled) {
      this.setAttribute('aria-disabled', 'true');
      this.setAttribute('tabindex', '-1');
    } else {
      this.setAttribute('aria-disabled', 'false');
      if (!this.hasAttribute('tabindex')) {
        this.setAttribute('tabindex', '0');
      } else if (this.getAttribute('tabindex') === '-1') {
        this.setAttribute('tabindex', '0');
      }
    }
  }

  _onClick(event) {
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  _onKeyDown(event) {
    if (this.disabled) {
      return;
    }
    if (event.key === ' ' || event.key === 'Spacebar') {
      this._spaceDown = true;
      event.preventDefault();
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.click();
    }
  }

  _onKeyUp(event) {
    if (this.disabled) {
      return;
    }
    if (this._spaceDown && (event.key === ' ' || event.key === 'Spacebar')) {
      this._spaceDown = false;
      event.preventDefault();
      this.click();
    }
  }
}

export function defineWcButton() {
  if (!customElements.get('wc-button')) {
    customElements.define('wc-button', WcButton);
  }
}
