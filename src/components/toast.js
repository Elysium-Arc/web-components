export class WcToastContainer extends HTMLElement {
  static get observedAttributes() {
    return ['position', 'max'];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          position: fixed;
          z-index: 99999;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          max-width: 420px;
          max-height: 100vh;
          overflow: hidden;
        }
        
        :host([position="top-right"]), :host(:not([position])) {
          top: 0;
          right: 0;
          align-items: flex-end;
        }
        
        :host([position="top-left"]) {
          top: 0;
          left: 0;
          align-items: flex-start;
        }
        
        :host([position="top-center"]) {
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          align-items: center;
        }
        
        :host([position="bottom-right"]) {
          bottom: 0;
          right: 0;
          align-items: flex-end;
          flex-direction: column-reverse;
        }
        
        :host([position="bottom-left"]) {
          bottom: 0;
          left: 0;
          align-items: flex-start;
          flex-direction: column-reverse;
        }
        
        :host([position="bottom-center"]) {
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          align-items: center;
          flex-direction: column-reverse;
        }
        
        ::slotted(wc-toast) {
          pointer-events: auto;
        }
      </style>
      <slot></slot>
    `;
    
    this._slot = shadow.querySelector('slot');
  }

  connectedCallback() {
    this._slot.addEventListener('slotchange', () => this._enforceMax());
  }

  get position() {
    return this.getAttribute('position') || 'top-right';
  }

  set position(v) {
    this.setAttribute('position', v);
  }

  get max() {
    return parseInt(this.getAttribute('max')) || 5;
  }

  set max(v) {
    this.setAttribute('max', String(v));
  }

  _enforceMax() {
    const toasts = this.querySelectorAll('wc-toast');
    const overflow = toasts.length - this.max;
    if (overflow > 0) {
      for (let i = 0; i < overflow; i++) {
        toasts[i].dismiss();
      }
    }
  }
}

export class WcToast extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'duration', 'dismissible'];
  }

  constructor() {
    super();
    this._handleClose = this._handleClose.bind(this);
    this._timeoutId = null;
    
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          width: 100%;
          min-width: 300px;
          max-width: 400px;
          padding: 1rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          font-family: inherit;
          font-size: 0.875rem;
          line-height: 1.5;
          animation: slideIn 0.3s ease;
          transition: opacity 0.2s, transform 0.2s;
        }
        
        :host([hidden]) {
          display: none;
        }
        
        :host(.removing) {
          opacity: 0;
          transform: translateX(100%);
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        :host([type="success"]) {
          border-left: 4px solid #22c55e;
        }
        
        :host([type="error"]) {
          border-left: 4px solid #ef4444;
        }
        
        :host([type="warning"]) {
          border-left: 4px solid #f59e0b;
        }
        
        :host([type="info"]) {
          border-left: 4px solid #3b82f6;
        }
        
        .icon {
          flex-shrink: 0;
          width: 1.25rem;
          height: 1.25rem;
        }
        
        :host([type="success"]) .icon { color: #22c55e; }
        :host([type="error"]) .icon { color: #ef4444; }
        :host([type="warning"]) .icon { color: #f59e0b; }
        :host([type="info"]) .icon { color: #3b82f6; }
        
        .icon svg {
          width: 100%;
          height: 100%;
        }
        
        .content {
          flex: 1;
          min-width: 0;
        }
        
        .title {
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }
        
        .title:only-child {
          margin: 0;
        }
        
        .message {
          color: #64748b;
          margin: 0;
        }
        
        .actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        
        .close-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          padding: 0;
          margin: -0.25rem -0.25rem -0.25rem 0;
          border: none;
          background: none;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 0.25rem;
          transition: color 0.1s, background 0.1s;
        }
        
        .close-btn:hover {
          color: #475569;
          background: #f1f5f9;
        }
        
        .close-btn svg {
          width: 1rem;
          height: 1rem;
        }
        
        ::slotted([slot="action"]) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 500;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background 0.1s, color 0.1s;
        }
      </style>
      
      <div class="icon" part="icon">
        <svg class="icon-success" viewBox="0 0 20 20" fill="currentColor" style="display:none">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <svg class="icon-error" viewBox="0 0 20 20" fill="currentColor" style="display:none">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <svg class="icon-warning" viewBox="0 0 20 20" fill="currentColor" style="display:none">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <svg class="icon-info" viewBox="0 0 20 20" fill="currentColor" style="display:none">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
      </div>
      
      <div class="content" part="content">
        <p class="title" part="title"><slot name="title"></slot></p>
        <p class="message" part="message"><slot></slot></p>
        <div class="actions" part="actions">
          <slot name="action"></slot>
        </div>
      </div>
      
      <button type="button" class="close-btn" part="close" aria-label="Dismiss">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    `;
    
    this._iconContainer = shadow.querySelector('.icon');
    this._closeBtn = shadow.querySelector('.close-btn');
    this._title = shadow.querySelector('.title');
    this._message = shadow.querySelector('.message');
    this._actions = shadow.querySelector('.actions');
  }

  connectedCallback() {
    this._closeBtn.addEventListener('click', this._handleClose);
    this._updateIcon();
    this._updateVisibility();
    this._startTimer();
    
    this.querySelectorAll('[slot="action"][data-dismiss]').forEach(btn => {
      btn.addEventListener('click', this._handleClose);
    });
  }

  disconnectedCallback() {
    this._clearTimer();
  }

  attributeChangedCallback(name) {
    if (name === 'type') {
      this._updateIcon();
    }
    if (name === 'dismissible') {
      this._updateVisibility();
    }
    if (name === 'duration') {
      this._startTimer();
    }
  }

  get type() { return this.getAttribute('type') || 'info'; }
  set type(v) { this.setAttribute('type', v); }

  get duration() { 
    const d = this.getAttribute('duration');
    if (d === '0' || d === 'false') return 0;
    return parseInt(d) || 5000; 
  }
  set duration(v) { this.setAttribute('duration', String(v)); }

  get dismissible() { return this.getAttribute('dismissible') !== 'false'; }
  set dismissible(v) { this.setAttribute('dismissible', v ? 'true' : 'false'); }

  _updateIcon() {
    const icons = this._iconContainer.querySelectorAll('svg');
    icons.forEach(icon => icon.style.display = 'none');
    
    const activeIcon = this._iconContainer.querySelector(`.icon-${this.type}`);
    if (activeIcon) {
      activeIcon.style.display = 'block';
    }
  }

  _updateVisibility() {
    this._closeBtn.style.display = this.dismissible ? 'flex' : 'none';
    
    const hasTitle = this.querySelector('[slot="title"]') || this.shadowRoot.querySelector('slot[name="title"]').assignedNodes().length > 0;
    const hasMessage = this.shadowRoot.querySelector('slot:not([name])').assignedNodes().length > 0;
    const hasActions = this.querySelector('[slot="action"]');
    
    this._actions.style.display = hasActions ? 'flex' : 'none';
  }

  _startTimer() {
    this._clearTimer();
    if (this.duration > 0) {
      this._timeoutId = setTimeout(() => {
        this.dismiss();
      }, this.duration);
    }
  }

  _clearTimer() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
  }

  _handleClose() {
    this.dismiss();
  }

  dismiss() {
    this._clearTimer();
    this.classList.add('removing');
    
    this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true }));
    
    setTimeout(() => {
      this.remove();
    }, 200);
  }

  static show(options = {}) {
    const {
      title = '',
      message = '',
      type = 'info',
      duration = 5000,
      dismissible = true,
      actions = [],
      container = 'top-right'
    } = options;

    let containerEl = document.querySelector(`wc-toast-container[position="${container}"]`);
    if (!containerEl) {
      containerEl = document.querySelector('wc-toast-container');
    }
    if (!containerEl) {
      containerEl = document.createElement('wc-toast-container');
      containerEl.position = container;
      document.body.appendChild(containerEl);
    }

    const toast = document.createElement('wc-toast');
    toast.type = type;
    toast.duration = duration;
    toast.dismissible = dismissible;
    
    if (title) {
      const titleEl = document.createElement('span');
      titleEl.slot = 'title';
      titleEl.textContent = title;
      toast.appendChild(titleEl);
    }
    
    if (message) {
      toast.appendChild(document.createTextNode(message));
    }
    
    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.slot = 'action';
      btn.textContent = action.label;
      btn.className = action.class || '';
      if (action.dismiss !== false) {
        btn.dataset.dismiss = '';
      }
      if (action.onClick) {
        btn.addEventListener('click', action.onClick);
      }
      toast.appendChild(btn);
    });
    
    containerEl.appendChild(toast);
    
    return toast;
  }
}

export function defineWcToast() {
  if (!customElements.get('wc-toast-container')) {
    customElements.define('wc-toast-container', WcToastContainer);
  }
  if (!customElements.get('wc-toast')) {
    customElements.define('wc-toast', WcToast);
  }
}
