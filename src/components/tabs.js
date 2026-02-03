import { ensureId } from '../utils/id.js';

const TAB_STATE_ATTR = 'data-state';

export class WcTabs extends HTMLElement {
  static get observedAttributes() {
    return ['value'];
  }

  constructor() {
    super();
    this._onClick = this._onClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
        }
        
        ::slotted([slot="tabs"]) {
          display: flex;
          flex-wrap: wrap;
        }
        
        .panels {
          display: block;
        }
      </style>
      <slot name="tabs"></slot>
      <div class="panels">
        <slot name="panels"></slot>
      </div>
    `;
  }

  connectedCallback() {
    this._upgradeProperty('value');
    this._setup();
  }

  disconnectedCallback() {
    this._teardown();
  }

  attributeChangedCallback(name) {
    if (name === 'value') {
      if (this._tabs) {
        this._applySelection(this.value);
      }
    }
  }

  get value() {
    return this.getAttribute('value') || '';
  }

  set value(newValue) {
    if (newValue === null || newValue === undefined) {
      this.removeAttribute('value');
    } else {
      this.setAttribute('value', String(newValue));
    }
  }

  select(value) {
    this.value = value;
  }

  _upgradeProperty(propertyName) {
    if (Object.prototype.hasOwnProperty.call(this, propertyName)) {
      const value = this[propertyName];
      delete this[propertyName];
      this[propertyName] = value;
    }
  }

  _setup() {
    this._teardown();
    this._tabList = this.querySelector('[slot="tabs"]');
    this._tabs = Array.from(this.querySelectorAll('[role="tab"]'));
    
    // Fallback: find tabs by data-value within tab list
    if (this._tabs.length === 0 && this._tabList) {
      this._tabs = Array.from(this._tabList.querySelectorAll('[data-value]'));
    }
    
    // Find panels - elements with slot="panels" and data-value
    this._panels = Array.from(this.querySelectorAll('[slot="panels"][data-value]'));

    if (this._tabList) {
      if (!this._tabList.hasAttribute('role')) {
        this._tabList.setAttribute('role', 'tablist');
      }
      this._tabList.addEventListener('click', this._onClick);
      this._tabList.addEventListener('keydown', this._onKeyDown);
    }

    this._tabs.forEach((tab, index) => {
      if (!tab.hasAttribute('role')) {
        tab.setAttribute('role', 'tab');
      }
      tab.setAttribute('tabindex', '-1');
      const value = tab.getAttribute('value') || tab.getAttribute('data-value');
      if (!value) {
        tab.setAttribute('data-value', String(index));
      }
      ensureId(tab, 'wc-tab');
    });

    this._panels.forEach((panel, index) => {
      if (!panel.hasAttribute('role')) {
        panel.setAttribute('role', 'tabpanel');
      }
      if (!panel.hasAttribute('tabindex')) {
        panel.setAttribute('tabindex', '0');
      }
      const value = panel.getAttribute('value') || panel.getAttribute('data-value');
      if (!value) {
        panel.setAttribute('data-value', String(index));
      }
      panel.style.setProperty('display', 'none', 'important');
      ensureId(panel, 'wc-tabpanel');
    });

    this._tabs.forEach((tab) => {
      const value = tab.getAttribute('value') || tab.getAttribute('data-value');
      const panel = this._panels.find((candidate) => 
        (candidate.getAttribute('value') || candidate.getAttribute('data-value')) === value
      );
      if (panel) {
        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('aria-labelledby', tab.id);
      }
    });

    const initialValue = this._getInitialValue();
    if (initialValue) {
      if (this.value !== initialValue) {
        this.setAttribute('value', initialValue);
      } else {
        this._applySelection(initialValue);
      }
    }
  }

  _teardown() {
    if (this._tabList) {
      this._tabList.removeEventListener('click', this._onClick);
      this._tabList.removeEventListener('keydown', this._onKeyDown);
    }
  }

  _getInitialValue() {
    if (this.value && this._tabs.some((tab) => 
      (tab.getAttribute('value') || tab.getAttribute('data-value')) === this.value
    )) {
      return this.value;
    }
    const selectedTab = this._tabs.find((tab) => tab.hasAttribute('selected'));
    if (selectedTab) {
      return selectedTab.getAttribute('value') || selectedTab.getAttribute('data-value');
    }
    return this._tabs[0]?.getAttribute('value') || this._tabs[0]?.getAttribute('data-value') || '';
  }

  _applySelection(value) {
    if (!value) {
      return;
    }
    this._tabs.forEach((tab) => {
      const tabValue = tab.getAttribute('value') || tab.getAttribute('data-value');
      const isSelected = tabValue === value;
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
      tab.toggleAttribute('selected', isSelected);
      tab.setAttribute(TAB_STATE_ATTR, isSelected ? 'active' : 'inactive');
    });

    this._panels.forEach((panel) => {
      const panelValue = panel.getAttribute('value') || panel.getAttribute('data-value');
      const isSelected = panelValue === value;
      if (isSelected) {
        panel.style.removeProperty('display');
      } else {
        panel.style.setProperty('display', 'none', 'important');
      }
      panel.setAttribute(TAB_STATE_ATTR, isSelected ? 'active' : 'inactive');
    });
  }

  _onClick(event) {
    const tab = event.target.closest('[role="tab"]');
    if (!tab || !this.contains(tab)) {
      return;
    }
    if (tab.hasAttribute('disabled')) {
      return;
    }
    const value = tab.getAttribute('value') || tab.getAttribute('data-value');
    if (value) {
      this.select(value);
      tab.focus();
    }
  }

  _onKeyDown(event) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) {
      return;
    }

    const enabledTabs = this._tabs.filter((tab) => !tab.hasAttribute('disabled'));
    if (enabledTabs.length === 0) {
      return;
    }

    const current = event.target.closest('[role="tab"]');
    let currentIndex = enabledTabs.indexOf(current);
    if (currentIndex === -1) {
      currentIndex = 0;
    }

    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % enabledTabs.length;
    }
    if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    }
    if (event.key === 'Home') {
      nextIndex = 0;
    }
    if (event.key === 'End') {
      nextIndex = enabledTabs.length - 1;
    }

    event.preventDefault();
    const nextTab = enabledTabs[nextIndex];
    if (nextTab) {
      const value = nextTab.getAttribute('value') || nextTab.getAttribute('data-value');
      if (value) {
        this.select(value);
        nextTab.focus();
      }
    }
  }
}

export function defineWcTabs() {
  if (!customElements.get('wc-tabs')) {
    customElements.define('wc-tabs', WcTabs);
  }
}
