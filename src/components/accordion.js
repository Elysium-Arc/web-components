import { ensureId } from '../utils/id.js';
import { WcButton } from './button.js';

const ACCORDION_STATE_ATTR = 'data-state';

export class WcAccordion extends HTMLElement {
  constructor() {
    super();
    this._onTriggerClick = this._onTriggerClick.bind(this);

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
        }
      </style>
      <slot></slot>
    `;
  }

  connectedCallback() {
    this._setup();
  }

  disconnectedCallback() {
    this._teardown();
  }

  get multiple() {
    return this.hasAttribute('multiple');
  }

  _setup() {
    this._teardown();
    this._items = Array.from(this.querySelectorAll('wc-accordion-item'));

    this._items.forEach((item) => {
      ensureId(item, 'wc-accordion-item');
      const trigger = item.querySelector('[slot="trigger"]');
      const panel = item.querySelector('[slot="content"]');

      if (trigger) {
        trigger.addEventListener('click', this._onTriggerClick);
      }

      if (panel) {
        if (!panel.hasAttribute('role')) {
          panel.setAttribute('role', 'region');
        }
        if (!panel.hasAttribute('tabindex')) {
          panel.setAttribute('tabindex', '0');
        }
        ensureId(panel, 'wc-accordion-panel');
      }

      if (trigger && panel) {
        trigger.setAttribute('aria-controls', panel.id);
        panel.setAttribute('aria-labelledby', ensureId(trigger, 'wc-accordion-trigger'));
      }
    });

    this._syncAll();
  }

  _teardown() {
    if (!this._items) {
      return;
    }
    this._items.forEach((item) => {
      const trigger = item.querySelector('[slot="trigger"]');
      if (trigger) {
        trigger.removeEventListener('click', this._onTriggerClick);
      }
    });
  }

  _syncAll() {
    this._items.forEach((item) => {
      this._syncItem(item);
    });
  }

  _syncItem(item) {
    const isOpen = item.hasAttribute('open');
    item.setAttribute(ACCORDION_STATE_ATTR, isOpen ? 'open' : 'closed');

    const trigger = item.querySelector('[slot="trigger"]');
    const panel = item.querySelector('[slot="content"]');

    if (trigger) {
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      trigger.setAttribute(ACCORDION_STATE_ATTR, isOpen ? 'open' : 'closed');
    }
    if (panel) {
      panel.style.display = isOpen ? '' : 'none';
      panel.setAttribute(ACCORDION_STATE_ATTR, isOpen ? 'open' : 'closed');
    }
  }

  _onTriggerClick(event) {
    const trigger = event.currentTarget;
    const item = trigger.closest('wc-accordion-item');
    if (!item || item.hasAttribute('disabled') || trigger.hasAttribute('disabled')) {
      return;
    }
    const isOpen = item.hasAttribute('open');

    if (!this.multiple && !isOpen) {
      this._items.forEach((candidate) => {
        if (candidate !== item) {
          candidate.removeAttribute('open');
        }
      });
    }

    if (isOpen) {
      item.removeAttribute('open');
    } else {
      item.setAttribute('open', '');
    }

    this._syncAll();
  }
}

export class WcAccordionItem extends HTMLElement {
  constructor() {
    super();
    
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
        }
        
        .content {
          display: none;
          overflow: hidden;
        }
        
        :host([open]) .content {
          display: block;
        }
      </style>
      <slot name="trigger"></slot>
      <div class="content">
        <slot name="content"></slot>
      </div>
    `;
  }
}

export class WcAccordionTrigger extends WcButton {}

export function defineWcAccordion() {
  if (!customElements.get('wc-accordion')) {
    customElements.define('wc-accordion', WcAccordion);
  }
  if (!customElements.get('wc-accordion-item')) {
    customElements.define('wc-accordion-item', WcAccordionItem);
  }
  if (!customElements.get('wc-accordion-trigger')) {
    customElements.define('wc-accordion-trigger', WcAccordionTrigger);
  }
}
