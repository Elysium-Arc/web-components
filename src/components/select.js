export class WcSelect extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled', 'name', 'multiple', 'placeholder', 'searchable', 'url', 'search-param', 'value-field', 'label-field', 'min-chars', 'clearable', 'create'];
  }

  constructor() {
    super();
    this._handleControlMousedown = this._handleControlMousedown.bind(this);
    this._handleInputFocus = this._handleInputFocus.bind(this);
    this._handleInputKeydown = this._handleInputKeydown.bind(this);
    this._handleInput = this._handleInput.bind(this);
    this._handleDocumentClick = this._handleDocumentClick.bind(this);
    this._handleSlotChange = this._handleSlotChange.bind(this);
    
    this._isOpen = false;
    this._highlightedIndex = -1;
    this._slotOptions = [];
    this._remoteOptions = [];
    this._loading = false;
    this._abortController = null;
    this._debounceTimer = null;
    this._mouseDownOnControl = false;
    
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
          min-width: 200px;
          font-family: inherit;
        }
        
        :host([hidden]) {
          display: none;
        }
        
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
        
        .control {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.25rem;
          width: 100%;
          min-height: 2.5rem;
          padding: 0.375rem 0.5rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem;
          background: white;
          cursor: text;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        
        .control:hover {
          border-color: #94a3b8;
        }
        
        .control:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
        
        :host([disabled]) .control {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f1f5f9;
          pointer-events: none;
        }
        
        .tags-input {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.25rem;
          flex: 1;
          min-width: 0;
        }
        
        .tag {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.125rem 0.375rem;
          background: #e2e8f0;
          border-radius: 0.25rem;
          font-size: 0.8125rem;
          max-width: 100%;
          animation: tagIn 0.15s ease;
        }
        
        @keyframes tagIn {
          from { 
            opacity: 0; 
            transform: scale(0.8); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        .tag-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .tag-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1rem;
          height: 1rem;
          margin-left: 0.125rem;
          margin-right: -0.125rem;
          border-radius: 0.125rem;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.1s, background 0.1s;
        }
        
        .tag-remove:hover {
          opacity: 1;
          background: rgba(0, 0, 0, 0.1);
        }
        
        .tag-remove svg {
          width: 0.75rem;
          height: 0.75rem;
        }
        
        .input {
          flex: 1;
          min-width: 60px;
          border: none;
          outline: none;
          background: transparent;
          font: inherit;
          font-size: 0.875rem;
          padding: 0.125rem 0;
        }
        
        .input::placeholder {
          color: #94a3b8;
        }
        
        :host(:not([searchable])) .input {
          caret-color: transparent;
        }
        
        .single-value {
          flex: 1;
          font-size: 0.875rem;
          color: inherit;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          flex-shrink: 0;
          margin-left: auto;
        }
        
        .clear-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 1.25rem;
          height: 1.25rem;
          padding: 0;
          border: none;
          background: none;
          color: #64748b;
          cursor: pointer;
          border-radius: 0.25rem;
          transition: color 0.1s, background 0.1s;
        }
        
        .clear-btn:hover {
          color: #1e293b;
          background: #f1f5f9;
        }
        
        :host([clearable]) .control:hover .clear-btn.has-value,
        :host([clearable]) .control:focus-within .clear-btn.has-value {
          display: flex;
        }
        
        .arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.25rem;
          height: 1.25rem;
          color: #64748b;
          transition: transform 0.2s;
          pointer-events: none;
        }
        
        :host([open]) .arrow {
          transform: rotate(180deg);
        }
        
        .arrow svg,
        .clear-btn svg {
          width: 100%;
          height: 100%;
        }
        
        .dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          max-height: 16rem;
          overflow-y: auto;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          z-index: 9999;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-4px);
          transition: opacity 0.15s, transform 0.15s, visibility 0.15s;
        }
        
        :host([open]) .dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background 0.1s;
        }
        
        .option.highlighted {
          background: #f1f5f9;
        }
        
        .option.selected {
          background: #eff6ff;
          color: #1d4ed8;
        }
        
        .option.selected.highlighted {
          background: #dbeafe;
        }
        
        .option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .option-check {
          display: none;
          width: 1rem;
          height: 1rem;
          color: #3b82f6;
        }
        
        .option.selected .option-check {
          display: block;
        }
        
        .option-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .option-create {
          color: #3b82f6;
        }
        
        .option-create::before {
          content: '+ Create ';
        }
        
        .dropdown-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.75rem;
        }
        
        .select-all-btn {
          padding: 0.25rem 0.5rem;
          border: none;
          background: #f1f5f9;
          color: #475569;
          font-size: 0.75rem;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: background 0.1s, color 0.1s;
        }
        
        .select-all-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
        
        .selection-count {
          color: #64748b;
        }
        
        .empty-state {
          padding: 1rem;
          text-align: center;
          color: #64748b;
          font-size: 0.875rem;
        }
        
        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          color: #64748b;
          font-size: 0.875rem;
        }
        
        .spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .hidden-select {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        
        slot {
          display: none;
        }
      </style>
      
      <div class="control" part="control">
        <div class="tags-input">
          <input type="text" class="input" part="input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        </div>
        <div class="actions">
          <button type="button" class="clear-btn" part="clear" tabindex="-1" aria-label="Clear selection">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
          </button>
          <span class="arrow">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </span>
        </div>
      </div>
      
      <div class="dropdown" part="dropdown" role="listbox"></div>
      <select class="hidden-select" tabindex="-1" aria-hidden="true"></select>
      <slot></slot>
    `;
    
    this._control = shadow.querySelector('.control');
    this._tagsInput = shadow.querySelector('.tags-input');
    this._input = shadow.querySelector('.input');
    this._clearBtn = shadow.querySelector('.clear-btn');
    this._dropdown = shadow.querySelector('.dropdown');
    this._hiddenSelect = shadow.querySelector('.hidden-select');
    this._slot = shadow.querySelector('slot');
  }

  connectedCallback() {
    this._upgradeProperty('value');
    this._upgradeProperty('disabled');
    this._upgradeProperty('name');
    this._upgradeProperty('multiple');
    this._upgradeProperty('placeholder');
    this._upgradeProperty('searchable');
    this._upgradeProperty('url');
    
    this._control.addEventListener('mousedown', this._handleControlMousedown);
    this._input.addEventListener('focus', this._handleInputFocus);
    this._input.addEventListener('keydown', this._handleInputKeydown);
    this._input.addEventListener('input', this._handleInput);
    this._clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clear();
    });
    this._slot.addEventListener('slotchange', this._handleSlotChange);
    document.addEventListener('mousedown', this._handleDocumentClick);
    
    this._buildOptionsFromSlot();
    this._render();
  }

  disconnectedCallback() {
    document.removeEventListener('mousedown', this._handleDocumentClick);
    if (this._abortController) {
      this._abortController.abort();
    }
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this._render();
  }

  get value() {
    return this.getAttribute('value') || '';
  }

  set value(v) {
    if (v === null || v === undefined || v === '') {
      this.removeAttribute('value');
    } else {
      this.setAttribute('value', String(v));
    }
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  get multiple() { return this.hasAttribute('multiple'); }
  set multiple(v) { v ? this.setAttribute('multiple', '') : this.removeAttribute('multiple'); }

  get searchable() { return this.hasAttribute('searchable'); }
  set searchable(v) { v ? this.setAttribute('searchable', '') : this.removeAttribute('searchable'); }

  get clearable() { return this.hasAttribute('clearable'); }
  set clearable(v) { v ? this.setAttribute('clearable', '') : this.removeAttribute('clearable'); }

  get create() { return this.hasAttribute('create'); }
  set create(v) { v ? this.setAttribute('create', '') : this.removeAttribute('create'); }

  get name() { return this.getAttribute('name') || ''; }
  set name(v) { v ? this.setAttribute('name', v) : this.removeAttribute('name'); }

  get placeholder() { return this.getAttribute('placeholder') || 'Select...'; }
  set placeholder(v) { v ? this.setAttribute('placeholder', v) : this.removeAttribute('placeholder'); }

  get url() { return this.getAttribute('url') || ''; }
  set url(v) { v ? this.setAttribute('url', v) : this.removeAttribute('url'); }

  get searchParam() { return this.getAttribute('search-param') || 'q'; }
  get valueField() { return this.getAttribute('value-field') || 'value'; }
  get labelField() { return this.getAttribute('label-field') || 'label'; }
  get minChars() { return parseInt(this.getAttribute('min-chars') || '1', 10); }

  get selectedValues() {
    const val = this.value;
    if (!val) return [];
    return this.multiple ? val.split(',').map(v => v.trim()).filter(Boolean) : [val];
  }

  get _allOptions() {
    const seen = new Set();
    const options = [];
    for (const opt of [...this._slotOptions, ...this._remoteOptions]) {
      if (!seen.has(opt.value)) {
        seen.add(opt.value);
        options.push(opt);
      }
    }
    return options;
  }

  _upgradeProperty(prop) {
    if (Object.prototype.hasOwnProperty.call(this, prop)) {
      const v = this[prop];
      delete this[prop];
      this[prop] = v;
    }
  }

  _buildOptionsFromSlot() {
    this._slotOptions = Array.from(this.querySelectorAll('wc-option')).map(el => ({
      value: el.getAttribute('value') || el.textContent.trim(),
      label: el.textContent.trim(),
      disabled: el.hasAttribute('disabled')
    }));
  }

  _getFilteredOptions() {
    const query = this._input.value.toLowerCase().trim();
    let options = this._allOptions;
    
    if (query && this.searchable) {
      options = options.filter(o => o.label.toLowerCase().includes(query));
    }
    
    return options;
  }

  _render() {
    this._renderControl();
    this._renderDropdown();
    this._updateHiddenSelect();
  }

  _renderControl() {
    const selected = this.selectedValues;
    const hasValue = selected.length > 0;
    
    this._input.disabled = this.disabled;
    this._hiddenSelect.name = this.name;
    this._hiddenSelect.disabled = this.disabled;
    
    this._clearBtn.classList.toggle('has-value', hasValue);
    
    const existingTags = this._tagsInput.querySelectorAll('.tag, .single-value');
    existingTags.forEach(el => el.remove());
    
    if (this.multiple) {
      selected.forEach(val => {
        const opt = this._allOptions.find(o => o.value === val);
        if (opt) {
          const tag = document.createElement('span');
          tag.className = 'tag';
          tag.innerHTML = `
            <span class="tag-label">${this._escapeHtml(opt.label)}</span>
            <span class="tag-remove" data-value="${this._escapeHtml(val)}">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </span>
          `;
          tag.querySelector('.tag-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            this._removeValue(val);
          });
          this._tagsInput.insertBefore(tag, this._input);
        }
      });
      this._input.placeholder = selected.length ? '' : this.placeholder;
    } else {
      if (hasValue && !this._isOpen) {
        const opt = this._allOptions.find(o => o.value === selected[0]);
        if (opt) {
          const singleValue = document.createElement('span');
          singleValue.className = 'single-value';
          singleValue.textContent = opt.label;
          this._tagsInput.insertBefore(singleValue, this._input);
          this._input.style.position = 'absolute';
          this._input.style.opacity = '0';
          this._input.style.width = '0';
        }
      } else {
        this._input.style.position = '';
        this._input.style.opacity = '';
        this._input.style.width = '';
        this._input.placeholder = this.placeholder;
      }
    }
  }

  _renderDropdown() {
    const options = this._getFilteredOptions();
    const selected = this.selectedValues;
    const query = this._input.value.trim();
    
    this._dropdown.innerHTML = '';
    
    if (this._loading) {
      this._dropdown.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Loading...</span>
        </div>
      `;
      return;
    }
    
    if (options.length === 0 && !this.create) {
      this._dropdown.innerHTML = `<div class="empty-state">${query ? 'No results found' : 'No options available'}</div>`;
      return;
    }
    
    if (this.multiple && options.length > 0) {
      const selectableOptions = options.filter(o => !o.disabled);
      const allSelected = selectableOptions.length > 0 && selectableOptions.every(o => selected.includes(o.value));
      
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'dropdown-actions';
      actionsDiv.innerHTML = `
        <span class="selection-count">${selected.length} selected</span>
        <button type="button" class="select-all-btn">${allSelected ? 'Deselect All' : 'Select All'}</button>
      `;
      
      actionsDiv.querySelector('.select-all-btn').addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (allSelected) {
          this._deselectAll(selectableOptions);
        } else {
          this._selectAll(selectableOptions);
        }
      });
      
      this._dropdown.appendChild(actionsDiv);
    }
    
    let optionIndex = 0;
    
    options.forEach((opt) => {
      const div = document.createElement('div');
      div.className = 'option';
      div.setAttribute('role', 'option');
      div.dataset.value = opt.value;
      div.dataset.index = String(optionIndex);
      
      const isSelected = selected.includes(opt.value);
      if (isSelected) div.classList.add('selected');
      if (opt.disabled) div.classList.add('disabled');
      if (optionIndex === this._highlightedIndex) div.classList.add('highlighted');
      
      div.innerHTML = `
        <svg class="option-check" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        <span class="option-text">${this._escapeHtml(opt.label)}</span>
      `;
      
      div.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (!opt.disabled) {
          this._selectValue(opt.value);
        }
      });
      
      div.addEventListener('mouseenter', () => {
        this._highlightedIndex = parseInt(div.dataset.index);
        this._updateHighlight();
      });
      
      this._dropdown.appendChild(div);
      optionIndex++;
    });
    
    if (this.create && query && !options.some(o => o.label.toLowerCase() === query.toLowerCase())) {
      const createDiv = document.createElement('div');
      createDiv.className = 'option option-create';
      createDiv.dataset.create = query;
      createDiv.dataset.index = String(optionIndex);
      
      if (optionIndex === this._highlightedIndex) createDiv.classList.add('highlighted');
      
      createDiv.innerHTML = `<span class="option-text">"${this._escapeHtml(query)}"</span>`;
      
      createDiv.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._createOption(query);
      });
      
      createDiv.addEventListener('mouseenter', () => {
        this._highlightedIndex = parseInt(createDiv.dataset.index);
        this._updateHighlight();
      });
      
      this._dropdown.appendChild(createDiv);
    }
  }

  _updateHiddenSelect() {
    this._hiddenSelect.innerHTML = '';
    this.selectedValues.forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.selected = true;
      this._hiddenSelect.appendChild(opt);
    });
  }

  _updateHighlight() {
    this._dropdown.querySelectorAll('.option').forEach((el) => {
      const index = parseInt(el.dataset.index);
      el.classList.toggle('highlighted', index === this._highlightedIndex);
    });
  }

  _open() {
    if (this._isOpen || this.disabled) return;
    this._isOpen = true;
    this.setAttribute('open', '');
    this._highlightedIndex = 0;
    
    if (!this.multiple) {
      this._input.value = '';
    }
    
    this._render();
    this._input.focus();
  }

  _close() {
    if (!this._isOpen) return;
    this._isOpen = false;
    this.removeAttribute('open');
    this._highlightedIndex = -1;
    this._input.value = '';
    this._render();
  }

  _selectValue(val) {
    const opt = this._allOptions.find(o => o.value === val);
    if (!opt || opt.disabled) return;
    
    if (this.multiple) {
      const current = this.selectedValues;
      if (current.includes(val)) {
        this.value = current.filter(v => v !== val).join(',');
      } else {
        this.value = [...current, val].join(',');
      }
      this._input.value = '';
      this._input.focus();
    } else {
      this.value = val;
      this._close();
    }
    
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  _removeValue(val) {
    const current = this.selectedValues.filter(v => v !== val);
    this.value = current.join(',');
    this.dispatchEvent(new Event('change', { bubbles: true }));
    this._input.focus();
  }

  _selectAll(options) {
    const current = new Set(this.selectedValues);
    options.forEach(o => current.add(o.value));
    this.value = [...current].join(',');
    this._render();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  _deselectAll(options) {
    const toRemove = new Set(options.map(o => o.value));
    const remaining = this.selectedValues.filter(v => !toRemove.has(v));
    this.value = remaining.join(',');
    this._render();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  _createOption(label) {
    const value = label;
    
    this._slotOptions.push({
      value,
      label,
      disabled: false
    });
    
    this._selectValue(value);
    
    this.dispatchEvent(new CustomEvent('create', { 
      bubbles: true, 
      detail: { value, label } 
    }));
  }

  _handleControlMousedown(e) {
    if (this.disabled) return;
    
    const target = e.target;
    const isTagRemove = target.closest('.tag-remove');
    const isClearBtn = target.closest('.clear-btn');
    const isInput = target === this._input;
    
    if (isTagRemove || isClearBtn) return;
    
    this._mouseDownOnControl = true;
    
    if (isInput && this._isOpen) {
      return;
    }
    
    if (this._isOpen) {
      e.preventDefault();
      this._close();
    } else {
      this._open();
    }
  }

  _handleInputFocus() {
    if (this._mouseDownOnControl) {
      this._mouseDownOnControl = false;
      return;
    }
    if (!this._isOpen) {
      this._open();
    }
  }

  _handleInput() {
    this._highlightedIndex = 0;
    this._render();
    
    if (this.url) {
      const query = this._input.value.trim();
      if (query.length >= this.minChars) {
        if (this._debounceTimer) {
          clearTimeout(this._debounceTimer);
        }
        this._debounceTimer = setTimeout(() => {
          this._fetchRemote(query);
        }, 300);
      } else {
        this._remoteOptions = [];
        this._render();
      }
    }
  }

  _handleInputKeydown(e) {
    const options = this._dropdown.querySelectorAll('.option');
    const maxIndex = options.length - 1;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this._isOpen) {
          this._open();
        } else if (this._highlightedIndex < maxIndex) {
          this._highlightedIndex++;
          this._updateHighlight();
          this._scrollToHighlighted();
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (this._highlightedIndex > 0) {
          this._highlightedIndex--;
          this._updateHighlight();
          this._scrollToHighlighted();
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (this._isOpen) {
          const highlighted = this._dropdown.querySelector('.option.highlighted');
          if (highlighted) {
            if (highlighted.dataset.create) {
              this._createOption(highlighted.dataset.create);
            } else if (highlighted.dataset.value !== undefined) {
              this._selectValue(highlighted.dataset.value);
            }
          }
        } else {
          this._open();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        this._close();
        break;
        
      case 'Backspace':
        if (this.multiple && !this._input.value) {
          const selected = this.selectedValues;
          if (selected.length) {
            this._removeValue(selected[selected.length - 1]);
          }
        }
        break;
        
      case 'Tab':
        this._close();
        break;
    }
  }

  _handleDocumentClick(e) {
    if (!this._isOpen) return;
    
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._close();
    }
  }

  _handleSlotChange() {
    this._buildOptionsFromSlot();
    this._render();
  }

  _scrollToHighlighted() {
    const el = this._dropdown.querySelector('.option.highlighted');
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }

  async _fetchRemote(query) {
    if (this._abortController) {
      this._abortController.abort();
    }
    
    this._abortController = new AbortController();
    this._loading = true;
    this._render();
    
    try {
      let fetchUrl;
      
      if (this.url.includes('{query}')) {
        fetchUrl = this.url.replace('{query}', encodeURIComponent(query));
      } else if (this.searchParam) {
        const url = new URL(this.url, window.location.origin);
        url.searchParams.set(this.searchParam, query);
        fetchUrl = url.toString();
      } else {
        fetchUrl = this.url.replace(/\/$/, '') + '/' + encodeURIComponent(query);
      }
      
      const response = await fetch(fetchUrl, {
        signal: this._abortController.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.data || data.results || data.items || []);
      
      this._remoteOptions = items.map(item => ({
        value: String(this._getNestedValue(item, this.valueField) ?? item.id ?? item.value ?? ''),
        label: String(this._getNestedValue(item, this.labelField) ?? item.name ?? item.title ?? item.label ?? ''),
        disabled: false
      }));
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('WcSelect fetch error:', err);
        this._remoteOptions = [];
      }
    } finally {
      this._loading = false;
      this._abortController = null;
      this._render();
    }
  }

  _getNestedValue(obj, path) {
    if (!path) return undefined;
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  setOptions(options) {
    this._remoteOptions = options.map(o => ({
      value: String(o.value ?? o.id ?? ''),
      label: String(o.label ?? o.name ?? o.title ?? ''),
      disabled: !!o.disabled
    }));
    this._render();
  }

  addOption(option) {
    const opt = {
      value: String(option.value ?? option.id ?? ''),
      label: String(option.label ?? option.name ?? option.title ?? ''),
      disabled: !!option.disabled
    };
    this._slotOptions.push(opt);
    this._render();
  }

  clear() {
    this.value = '';
    this._input.value = '';
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  focus() {
    this._input.focus();
  }

  blur() {
    this._input.blur();
    this._close();
  }
}

export class WcOption extends HTMLElement {}

export function defineWcSelect() {
  if (!customElements.get('wc-select')) {
    customElements.define('wc-select', WcSelect);
  }
  if (!customElements.get('wc-option')) {
    customElements.define('wc-option', WcOption);
  }
}
