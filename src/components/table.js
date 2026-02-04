export class WcTable extends HTMLElement {
  static get observedAttributes() {
    return [
      'src',
      'data',
      'columns',
      'selectable',
      'select-mode',
      'sortable',
      'searchable',
      'page',
      'page-size',
      'total-items',
      'loading',
      'striped',
      'hoverable',
      'bordered',
      'compact',
      'sticky-header',
      'auto-columns',
      'id-field',
      'debounce',
    ];
  }

  constructor() {
    super();
    this._handleHeaderClick = this._handleHeaderClick.bind(this);
    this._handleRowClick = this._handleRowClick.bind(this);
    this._handleSelectAll = this._handleSelectAll.bind(this);
    this._handleCheckboxChange = this._handleCheckboxChange.bind(this);
    this._handlePageChange = this._handlePageChange.bind(this);
    this._handleSearch = this._handleSearch.bind(this);
    this._handleSlotChange = this._handleSlotChange.bind(this);

    this._data = [];
    this._columns = [];
    this._selectedRows = new Set();
    this._sortColumn = null;
    this._sortDirection = 'asc';
    this._searchTerm = '';
    this._initialized = false;
    this._abortController = null;
    this._debounceTimer = null;

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
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

        .table-container {
          position: relative;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          background: white;
        }

        .table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          gap: 1rem;
        }

        :host(:not([searchable])) .search-container {
          display: none;
        }

        .search-container {
          position: relative;
          flex: 1;
          max-width: 320px;
        }

        .search-input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2.25rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background: white;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1rem;
          height: 1rem;
          color: #94a3b8;
          pointer-events: none;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .selection-info {
          font-size: 0.875rem;
          color: #64748b;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        thead {
          background: #f8fafc;
        }

        :host([sticky-header]) thead {
          position: sticky;
          top: 0;
          z-index: 10;
        }

        th {
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
          user-select: none;
        }

        th.sortable {
          cursor: pointer;
          transition: background 0.15s;
        }

        th.sortable:hover {
          background: #f1f5f9;
        }

        .th-content {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sort-icon {
          width: 1rem;
          height: 1rem;
          opacity: 0.3;
          transition: opacity 0.15s, transform 0.15s;
        }

        th.sorted .sort-icon {
          opacity: 1;
        }

        th.sorted.desc .sort-icon {
          transform: rotate(180deg);
        }

        td {
          padding: 0.75rem 1rem;
          color: #1e293b;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }

        :host([compact]) th,
        :host([compact]) td {
          padding: 0.5rem 0.75rem;
        }

        :host([bordered]) th,
        :host([bordered]) td {
          border: 1px solid #e2e8f0;
        }

        tbody tr {
          transition: background 0.15s;
        }

        :host([striped]) tbody tr:nth-child(even) {
          background: #f8fafc;
        }

        :host([hoverable]) tbody tr:hover {
          background: #f1f5f9;
        }

        tbody tr.selected {
          background: #eff6ff !important;
        }

        :host([selectable]) tbody tr {
          cursor: pointer;
        }

        .checkbox-cell {
          width: 3rem;
          text-align: center;
        }

        .checkbox {
          width: 1rem;
          height: 1rem;
          cursor: pointer;
          accent-color: #3b82f6;
        }

        .checkbox-header {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Loading State */
        .loading-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
        }

        :host([loading]) .loading-overlay {
          opacity: 1;
          visibility: visible;
        }

        .spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Empty State */
        .empty-state {
          padding: 3rem 1rem;
          text-align: center;
          color: #64748b;
        }

        .empty-icon {
          width: 3rem;
          height: 3rem;
          margin: 0 auto 1rem;
          color: #cbd5e1;
        }

        .empty-title {
          font-size: 1rem;
          font-weight: 500;
          color: #475569;
          margin-bottom: 0.25rem;
        }

        .empty-description {
          font-size: 0.875rem;
        }

        /* Error State */
        .error-state {
          padding: 2rem 1rem;
          text-align: center;
          color: #dc2626;
          background: #fef2f2;
          border-radius: 0.375rem;
          margin: 1rem;
        }

        .error-icon {
          width: 2.5rem;
          height: 2.5rem;
          margin: 0 auto 0.75rem;
        }

        .error-title {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .error-message {
          font-size: 0.8125rem;
          color: #991b1b;
        }

        .retry-btn {
          margin-top: 0.75rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: white;
          background: #dc2626;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background 0.15s;
        }

        .retry-btn:hover {
          background: #b91c1c;
        }

        /* Pagination */
        .table-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          font-size: 0.875rem;
        }

        .pagination-info {
          color: #64748b;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          padding: 0;
          border: 1px solid #e2e8f0;
          background: white;
          color: #475569;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .pagination-btn svg {
          width: 1rem;
          height: 1rem;
        }

        .page-size-select {
          padding: 0.375rem 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background: white;
          cursor: pointer;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .table-header {
            flex-direction: column;
            align-items: stretch;
          }

          .search-container {
            max-width: none;
          }

          .table-footer {
            flex-direction: column;
            gap: 0.75rem;
          }
        }

        /* Slot for defining columns */
        slot {
          display: none;
        }
      </style>

      <div class="table-container" part="container">
        <div class="table-header" part="header">
          <div class="search-container">
            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" class="search-input" placeholder="Search..." part="search">
          </div>
          <div class="header-actions">
            <span class="selection-info"></span>
            <slot name="actions"></slot>
          </div>
        </div>

        <div class="table-wrapper" part="wrapper">
          <table part="table">
            <thead part="thead">
              <tr class="header-row"></tr>
            </thead>
            <tbody part="tbody"></tbody>
          </table>
        </div>

        <div class="empty-state" part="empty" hidden>
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <div class="empty-title">No data</div>
          <div class="empty-description">No records to display</div>
        </div>

        <div class="error-state" part="error" hidden>
          <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div class="error-title">Failed to load data</div>
          <div class="error-message"></div>
          <button class="retry-btn" type="button">Retry</button>
        </div>

        <div class="table-footer" part="footer" hidden>
          <div class="pagination-info"></div>
          <div class="pagination"></div>
        </div>

        <div class="loading-overlay" part="loading">
          <div class="spinner"></div>
        </div>
      </div>

      <slot></slot>
    `;

    this._container = shadow.querySelector('.table-container');
    this._tableHeader = shadow.querySelector('.table-header');
    this._searchInput = shadow.querySelector('.search-input');
    this._selectionInfo = shadow.querySelector('.selection-info');
    this._headerRow = shadow.querySelector('.header-row');
    this._tbody = shadow.querySelector('tbody');
    this._emptyState = shadow.querySelector('.empty-state');
    this._errorState = shadow.querySelector('.error-state');
    this._errorMessageEl = shadow.querySelector('.error-message');
    this._retryBtn = shadow.querySelector('.retry-btn');
    this._tableFooter = shadow.querySelector('.table-footer');
    this._paginationInfo = shadow.querySelector('.pagination-info');
    this._pagination = shadow.querySelector('.pagination');
    this._tableWrapper = shadow.querySelector('.table-wrapper');
    this._slot = shadow.querySelector('slot:not([name])');
  }

  connectedCallback() {
    this._upgradeProperty('data');
    this._upgradeProperty('columns');
    this._upgradeProperty('selectedRows');

    this._searchInput.addEventListener('input', this._handleSearch);
    this._slot.addEventListener('slotchange', this._handleSlotChange);
    this._retryBtn.addEventListener('click', () => this.reload());

    this._initialized = true;
    
    // Parse columns from attribute or slot
    this._parseColumnsAttribute();
    
    // Use requestAnimationFrame to ensure slotted content is available
    requestAnimationFrame(() => {
      this._parseSlotColumns();
      this._parseSlotRows();
      
      // If we have a src attribute, fetch remote data
      if (this.src) {
        this.reload();
      } else {
        this._render();
      }
    });
  }

  disconnectedCallback() {
    this._searchInput.removeEventListener('input', this._handleSearch);
    this._slot.removeEventListener('slotchange', this._handleSlotChange);
    this._cancelFetch();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._initialized) return;

    if (name === 'src' && newValue !== oldValue) {
      this.reload();
    } else if (name === 'data') {
      this._parseDataAttribute();
      this._render();
    } else if (name === 'columns') {
      this._parseColumnsAttribute();
      this._render();
    } else if (['page', 'page-size', 'total-items'].includes(name)) {
      if (this.src) {
        this.reload();
      } else {
        this._renderPagination();
      }
    } else {
      this._render();
    }
  }

  // ==================== Properties ====================

  /** URL for remote data fetching */
  get src() {
    return this.getAttribute('src');
  }

  set src(value) {
    if (value) {
      this.setAttribute('src', value);
    } else {
      this.removeAttribute('src');
    }
  }

  /** Table data array */
  get data() {
    return this._data;
  }

  set data(value) {
    this._data = Array.isArray(value) ? value : [];
    
    // Auto-generate columns from data if auto-columns is set and no columns defined
    if (this.hasAttribute('auto-columns') && this._columns.length === 0 && this._data.length > 0) {
      this._columns = this._autoGenerateColumns(this._data[0]);
    }
    
    if (this._initialized) {
      this._render();
    }
  }

  /** Column definitions - can be array, JSON string, or simple comma-separated keys */
  get columns() {
    return this._columns;
  }

  set columns(value) {
    if (Array.isArray(value)) {
      this._columns = value.map(col => this._normalizeColumn(col));
    } else if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        this._columns = parsed.map(col => this._normalizeColumn(col));
      } catch {
        // Simple comma-separated keys: "id,name,email"
        this._columns = value.split(',').map(key => ({
          key: key.trim(),
          label: this._formatLabel(key.trim()),
          sortable: this.sortable,
        }));
      }
    }
    if (this._initialized) {
      this._render();
    }
  }

  get selectedRows() {
    return Array.from(this._selectedRows);
  }

  set selectedRows(value) {
    this._selectedRows = new Set(Array.isArray(value) ? value : []);
    if (this._initialized) {
      this._updateSelection();
    }
  }

  get selectable() {
    return this.hasAttribute('selectable');
  }

  set selectable(value) {
    this._toggleAttribute('selectable', value);
  }

  get selectMode() {
    return this.getAttribute('select-mode') || 'multiple';
  }

  set selectMode(value) {
    this.setAttribute('select-mode', value);
  }

  get sortable() {
    return this.hasAttribute('sortable');
  }

  set sortable(value) {
    this._toggleAttribute('sortable', value);
  }

  get searchable() {
    return this.hasAttribute('searchable');
  }

  set searchable(value) {
    this._toggleAttribute('searchable', value);
  }

  get page() {
    return parseInt(this.getAttribute('page'), 10) || 1;
  }

  set page(value) {
    this.setAttribute('page', value);
  }

  get pageSize() {
    return parseInt(this.getAttribute('page-size'), 10) || 10;
  }

  set pageSize(value) {
    this.setAttribute('page-size', value);
  }

  get totalItems() {
    const attr = this.getAttribute('total-items');
    return attr !== null ? parseInt(attr, 10) : this._data.length;
  }

  set totalItems(value) {
    this.setAttribute('total-items', value);
  }

  get loading() {
    return this.hasAttribute('loading');
  }

  set loading(value) {
    this._toggleAttribute('loading', value);
  }

  get idField() {
    return this.getAttribute('id-field') || 'id';
  }

  set idField(value) {
    this.setAttribute('id-field', value);
  }

  get debounce() {
    return parseInt(this.getAttribute('debounce'), 10) || 300;
  }

  set debounce(value) {
    this.setAttribute('debounce', value);
  }

  // ==================== Remote Data ====================

  /**
   * Fetch data from the src URL
   * Supports query params for pagination, sorting, and searching
   */
  async reload() {
    if (!this.src) return;

    this._cancelFetch();
    this._abortController = new AbortController();

    this.loading = true;
    this._hideError();

    try {
      const url = this._buildUrl();
      const response = await fetch(url, {
        signal: this._abortController.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle different response formats
      if (Array.isArray(result)) {
        this._data = result;
      } else if (result.data && Array.isArray(result.data)) {
        this._data = result.data;
        // Update pagination info from response
        if (result.total !== undefined) {
          this.setAttribute('total-items', result.total);
        }
        if (result.page !== undefined) {
          this.setAttribute('page', result.page);
        }
      } else if (result.items && Array.isArray(result.items)) {
        this._data = result.items;
        if (result.total !== undefined) {
          this.setAttribute('total-items', result.total);
        }
      } else if (result.results && Array.isArray(result.results)) {
        this._data = result.results;
        if (result.count !== undefined) {
          this.setAttribute('total-items', result.count);
        }
      } else {
        this._data = [];
      }

      // Auto-generate columns if needed
      if (this.hasAttribute('auto-columns') && this._columns.length === 0 && this._data.length > 0) {
        this._columns = this._autoGenerateColumns(this._data[0]);
      }

      this._render();
      
      this.dispatchEvent(new CustomEvent('load', {
        detail: { data: this._data, response: result },
        bubbles: true,
      }));

    } catch (error) {
      if (error.name === 'AbortError') return;
      
      console.error('WcTable: Failed to fetch data:', error);
      this._showError(error.message);
      
      this.dispatchEvent(new CustomEvent('error', {
        detail: { error },
        bubbles: true,
      }));
    } finally {
      this.loading = false;
    }
  }

  _buildUrl() {
    const url = new URL(this.src, window.location.origin);
    
    // Add pagination params
    url.searchParams.set('page', this.page);
    url.searchParams.set('per_page', this.pageSize);
    url.searchParams.set('limit', this.pageSize);
    url.searchParams.set('offset', (this.page - 1) * this.pageSize);
    
    // Add sort params
    if (this._sortColumn) {
      url.searchParams.set('sort', this._sortColumn);
      url.searchParams.set('order', this._sortDirection);
      url.searchParams.set('sort_by', this._sortColumn);
      url.searchParams.set('sort_order', this._sortDirection);
    }
    
    // Add search param
    if (this._searchTerm) {
      url.searchParams.set('search', this._searchTerm);
      url.searchParams.set('q', this._searchTerm);
    }
    
    return url.toString();
  }

  _cancelFetch() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }

  _showError(message) {
    this._errorState.hidden = false;
    this._errorMessageEl.textContent = message;
    this._tableWrapper.hidden = true;
    this._emptyState.hidden = true;
  }

  _hideError() {
    this._errorState.hidden = true;
  }

  // ==================== Data & Column Parsing ====================

  _parseDataAttribute() {
    const dataAttr = this.getAttribute('data');
    if (dataAttr) {
      try {
        const parsed = JSON.parse(dataAttr);
        this._data = Array.isArray(parsed) ? parsed : [];
        
        // Auto-generate columns if needed
        if (this.hasAttribute('auto-columns') && this._columns.length === 0 && this._data.length > 0) {
          this._columns = this._autoGenerateColumns(this._data[0]);
        }
      } catch (e) {
        console.warn('WcTable: Invalid JSON in data attribute', e);
      }
    }
  }

  _parseColumnsAttribute() {
    const columnsAttr = this.getAttribute('columns');
    if (columnsAttr) {
      this.columns = columnsAttr;
    }
  }

  _parseSlotColumns() {
    // Try to get slotted elements first
    let slottedColumns = this._slot.assignedElements().filter(
      (el) => el.tagName.toUpperCase() === 'WC-TABLE-COLUMN'
    );

    // Fallback: check direct children if slot hasn't distributed yet
    if (slottedColumns.length === 0) {
      slottedColumns = Array.from(this.querySelectorAll(':scope > wc-table-column'));
    }

    if (slottedColumns.length > 0) {
      this._columns = slottedColumns.map((col) => ({
        key: col.getAttribute('key') || '',
        label: col.getAttribute('label') || this._formatLabel(col.getAttribute('key') || ''),
        sortable: col.hasAttribute('sortable'),
        width: col.getAttribute('width') || null,
        align: col.getAttribute('align') || 'left',
        render: col._renderFn || null,
        template: col.innerHTML.trim() || null,
        format: col.getAttribute('format') || null,
      }));
    }
  }

  _parseSlotRows() {
    // Try to get slotted row elements
    let slottedRows = this._slot.assignedElements().filter(
      (el) => el.tagName.toUpperCase() === 'WC-TABLE-ROW'
    );

    // Fallback: check direct children if slot hasn't distributed yet
    if (slottedRows.length === 0) {
      slottedRows = Array.from(this.querySelectorAll(':scope > wc-table-row'));
    }

    if (slottedRows.length > 0) {
      // If no columns defined yet, auto-generate from first row's attributes
      if (this._columns.length === 0) {
        const firstRow = slottedRows[0];
        const attrs = Array.from(firstRow.attributes)
          .filter(attr => !['id', 'class', 'style', 'slot'].includes(attr.name))
          .map(attr => attr.name);
        
        if (attrs.length > 0) {
          this._columns = attrs.map(key => ({
            key,
            label: this._formatLabel(key),
            sortable: this.sortable,
          }));
        }
      }

      // Parse row data from attributes
      this._data = slottedRows.map((row) => {
        const rowData = {};
        // Get data from attributes
        Array.from(row.attributes).forEach(attr => {
          if (!['id', 'class', 'style', 'slot'].includes(attr.name)) {
            rowData[attr.name] = attr.value;
          }
        });
        // Also check for nested wc-table-cell elements
        const cells = row.querySelectorAll('wc-table-cell');
        cells.forEach(cell => {
          const key = cell.getAttribute('key');
          if (key) {
            rowData[key] = cell.innerHTML.trim();
          }
        });
        return rowData;
      });
    }
  }

  _normalizeColumn(col) {
    if (typeof col === 'string') {
      return {
        key: col,
        label: this._formatLabel(col),
        sortable: this.sortable,
      };
    }
    return {
      key: col.key || col.field || col.name || '',
      label: col.label || col.title || col.header || this._formatLabel(col.key || ''),
      sortable: col.sortable !== undefined ? col.sortable : this.sortable,
      width: col.width || null,
      align: col.align || 'left',
      render: col.render || null,
      template: col.template || null,
      format: col.format || null,
    };
  }

  _autoGenerateColumns(sampleRow) {
    return Object.keys(sampleRow)
      .filter(key => {
        if (key.startsWith('_')) return false; // Skip private fields
        const value = sampleRow[key];
        // Skip objects and arrays (they'd display as [object Object])
        if (value !== null && typeof value === 'object') return false;
        return true;
      })
      .map(key => ({
        key,
        label: this._formatLabel(key),
        sortable: this.sortable,
      }));
  }

  _formatLabel(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  }

  _handleSlotChange() {
    this._parseSlotColumns();
    this._parseSlotRows();
    this._render();
  }

  // ==================== Utility Methods ====================

  _upgradeProperty(propertyName) {
    if (Object.prototype.hasOwnProperty.call(this, propertyName)) {
      const value = this[propertyName];
      delete this[propertyName];
      this[propertyName] = value;
    }
  }

  _toggleAttribute(name, value) {
    if (value) {
      this.setAttribute(name, '');
    } else {
      this.removeAttribute(name);
    }
  }

  // ==================== Rendering ====================

  _render() {
    this._renderHeader();
    this._renderBody();
    this._renderPagination();
    this._updateEmptyState();
    this._updateSelectionInfo();
  }

  _renderHeader() {
    this._headerRow.innerHTML = '';

    // Add checkbox column if selectable
    if (this.selectable && this.selectMode === 'multiple') {
      const th = document.createElement('th');
      th.className = 'checkbox-cell';
      th.innerHTML = `
        <div class="checkbox-header">
          <input type="checkbox" class="checkbox select-all" aria-label="Select all rows">
        </div>
      `;
      th.querySelector('.select-all').addEventListener('change', this._handleSelectAll);
      this._headerRow.appendChild(th);
    } else if (this.selectable) {
      const th = document.createElement('th');
      th.className = 'checkbox-cell';
      this._headerRow.appendChild(th);
    }

    // Render column headers
    this._columns.forEach((column) => {
      const th = document.createElement('th');
      const isSortable = this.sortable && column.sortable !== false;
      const isSorted = this._sortColumn === column.key;

      if (column.width) {
        th.style.width = column.width;
      }
      th.style.textAlign = column.align || 'left';

      if (isSortable) {
        th.classList.add('sortable');
        if (isSorted) {
          th.classList.add('sorted');
          if (this._sortDirection === 'desc') {
            th.classList.add('desc');
          }
        }
        th.dataset.column = column.key;
        th.addEventListener('click', this._handleHeaderClick);
      }

      th.innerHTML = `
        <span class="th-content">
          <span>${column.label}</span>
          ${isSortable ? `
            <svg class="sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
            </svg>
          ` : ''}
        </span>
      `;

      this._headerRow.appendChild(th);
    });
  }

  _renderBody() {
    this._tbody.innerHTML = '';
    const displayData = this._getDisplayData();

    displayData.forEach((row, index) => {
      const tr = document.createElement('tr');
      const rowId = row[this.idField] ?? index;
      tr.dataset.rowId = rowId;

      if (this._selectedRows.has(rowId)) {
        tr.classList.add('selected');
      }

      if (this.selectable) {
        tr.addEventListener('click', this._handleRowClick);
      }

      // Add checkbox cell if selectable
      if (this.selectable) {
        const td = document.createElement('td');
        td.className = 'checkbox-cell';
        td.innerHTML = `
          <input type="checkbox" 
            class="checkbox row-checkbox" 
            aria-label="Select row"
            ${this._selectedRows.has(rowId) ? 'checked' : ''}>
        `;
        td.querySelector('.row-checkbox').addEventListener('change', this._handleCheckboxChange);
        tr.appendChild(td);
      }

      // Render cells
      this._columns.forEach((column) => {
        const td = document.createElement('td');
        td.style.textAlign = column.align || 'left';

        const rawValue = row[column.key];
        let content = '';

        if (column.render && typeof column.render === 'function') {
          // Custom render function
          const result = column.render(rawValue, row, index);
          if (typeof result === 'string') {
            content = result;
          } else if (result instanceof Node) {
            td.appendChild(result);
            tr.appendChild(td);
            return;
          }
        } else if (column.template) {
          // Template string with {{key}} interpolation
          content = column.template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return row[key] ?? '';
          });
        } else if (column.format) {
          // Built-in formatters
          content = this._formatValue(rawValue, column.format);
        } else {
          // Default: raw value
          content = rawValue ?? '';
        }

        td.innerHTML = content;
        tr.appendChild(td);
      });

      this._tbody.appendChild(tr);
    });

    this._updateSelectAllState();
  }

  _formatValue(value, format) {
    if (value == null) return '';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      case 'number':
        return new Intl.NumberFormat().format(value);
      case 'percent':
        return new Intl.NumberFormat('en-US', { style: 'percent' }).format(value / 100);
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'time':
        return new Date(value).toLocaleTimeString();
      case 'boolean':
        return value ? '✓' : '✗';
      default:
        return String(value);
    }
  }

  _renderPagination() {
    const totalItems = this.totalItems;
    const pageSize = this.pageSize;
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = this.page;

    if (totalPages <= 1 && !this.hasAttribute('total-items')) {
      this._tableFooter.hidden = true;
      return;
    }

    this._tableFooter.hidden = false;

    // Pagination info
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    this._paginationInfo.textContent = `Showing ${start}-${end} of ${totalItems}`;

    // Pagination buttons
    this._pagination.innerHTML = '';

    // Previous button
    const prevBtn = this._createPaginationButton(
      `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>`,
      currentPage - 1,
      currentPage === 1
    );
    this._pagination.appendChild(prevBtn);

    // Page numbers
    const pages = this._getPageNumbers(currentPage, totalPages);
    pages.forEach((pageNum) => {
      if (pageNum === '...') {
        const span = document.createElement('span');
        span.className = 'pagination-ellipsis';
        span.textContent = '...';
        span.style.padding = '0 0.25rem';
        this._pagination.appendChild(span);
      } else {
        const btn = this._createPaginationButton(
          pageNum.toString(),
          pageNum,
          false,
          pageNum === currentPage
        );
        this._pagination.appendChild(btn);
      }
    });

    // Next button
    const nextBtn = this._createPaginationButton(
      `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>`,
      currentPage + 1,
      currentPage === totalPages
    );
    this._pagination.appendChild(nextBtn);
  }

  _createPaginationButton(content, page, disabled = false, active = false) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pagination-btn' + (active ? ' active' : '');
    btn.innerHTML = content;
    btn.disabled = disabled;
    btn.dataset.page = page;
    btn.addEventListener('click', this._handlePageChange);
    return btn;
  }

  _getPageNumbers(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];

    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total);
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }

    return pages;
  }

  _getDisplayData() {
    let data = [...this._data];

    // If remote data, don't filter/sort/paginate client-side
    if (this.src) {
      return data;
    }

    // Filter by search term (client-side)
    if (this._searchTerm) {
      const term = this._searchTerm.toLowerCase();
      data = data.filter((row) =>
        this._columns.some((col) => {
          const value = row[col.key];
          return value && String(value).toLowerCase().includes(term);
        })
      );
    }

    // Sort data (client-side)
    if (this._sortColumn) {
      data.sort((a, b) => {
        const aVal = a[this._sortColumn];
        const bVal = b[this._sortColumn];

        let comparison = 0;
        if (aVal == null) comparison = 1;
        else if (bVal == null) comparison = -1;
        else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return this._sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    // Paginate (client-side)
    if (this.pageSize > 0) {
      const start = (this.page - 1) * this.pageSize;
      data = data.slice(start, start + this.pageSize);
    }

    return data;
  }

  _updateEmptyState() {
    const hasData = this._getDisplayData().length > 0;
    const hasColumns = this._columns.length > 0;
    const hasError = !this._errorState.hidden;
    
    // Only show empty state if we have columns defined but no data (and no error)
    const showEmpty = hasColumns && !hasData && !hasError;
    
    this._emptyState.hidden = !showEmpty;
    this._tableWrapper.hidden = showEmpty || hasError;
  }

  _updateSelectionInfo() {
    const count = this._selectedRows.size;
    if (count > 0) {
      this._selectionInfo.textContent = `${count} selected`;
    } else {
      this._selectionInfo.textContent = '';
    }
  }

  _updateSelectAllState() {
    const selectAll = this._headerRow.querySelector('.select-all');
    if (!selectAll) return;

    const displayData = this._getDisplayData();
    const allIds = displayData.map((row, i) => row[this.idField] ?? i);
    const selectedCount = allIds.filter((id) => this._selectedRows.has(id)).length;

    if (selectedCount === 0) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    } else if (selectedCount === allIds.length) {
      selectAll.checked = true;
      selectAll.indeterminate = false;
    } else {
      selectAll.checked = false;
      selectAll.indeterminate = true;
    }
  }

  _updateSelection() {
    const rows = this._tbody.querySelectorAll('tr');
    rows.forEach((row) => {
      const rowId = this._parseRowId(row.dataset.rowId);
      const checkbox = row.querySelector('.row-checkbox');
      
      if (this._selectedRows.has(rowId)) {
        row.classList.add('selected');
        if (checkbox) checkbox.checked = true;
      } else {
        row.classList.remove('selected');
        if (checkbox) checkbox.checked = false;
      }
    });

    this._updateSelectAllState();
    this._updateSelectionInfo();
  }

  _parseRowId(value) {
    const num = parseInt(value, 10);
    return isNaN(num) ? value : num;
  }

  // ==================== Event Handlers ====================

  _handleHeaderClick(event) {
    const th = event.currentTarget;
    const column = th.dataset.column;

    if (this._sortColumn === column) {
      this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortColumn = column;
      this._sortDirection = 'asc';
    }

    if (this.src) {
      this.reload();
    } else {
      this._render();
    }

    this.dispatchEvent(
      new CustomEvent('sort', {
        detail: { column: this._sortColumn, direction: this._sortDirection },
        bubbles: true,
      })
    );
  }

  _handleRowClick(event) {
    // Don't trigger if clicking checkbox directly
    if (event.target.classList.contains('row-checkbox')) return;

    const tr = event.currentTarget;
    const rowId = this._parseRowId(tr.dataset.rowId);

    if (this.selectMode === 'single') {
      this._selectedRows.clear();
      this._selectedRows.add(rowId);
    } else {
      if (this._selectedRows.has(rowId)) {
        this._selectedRows.delete(rowId);
      } else {
        this._selectedRows.add(rowId);
      }
    }

    this._updateSelection();
    this._dispatchSelectionChange();
  }

  _handleCheckboxChange(event) {
    event.stopPropagation();
    const checkbox = event.target;
    const tr = checkbox.closest('tr');
    const rowId = this._parseRowId(tr.dataset.rowId);

    if (this.selectMode === 'single') {
      this._selectedRows.clear();
      if (checkbox.checked) {
        this._selectedRows.add(rowId);
      }
    } else {
      if (checkbox.checked) {
        this._selectedRows.add(rowId);
      } else {
        this._selectedRows.delete(rowId);
      }
    }

    this._updateSelection();
    this._dispatchSelectionChange();
  }

  _handleSelectAll(event) {
    const checked = event.target.checked;
    const displayData = this._getDisplayData();

    displayData.forEach((row, index) => {
      const rowId = row[this.idField] ?? index;
      if (checked) {
        this._selectedRows.add(rowId);
      } else {
        this._selectedRows.delete(rowId);
      }
    });

    this._updateSelection();
    this._dispatchSelectionChange();
  }

  _handlePageChange(event) {
    const page = parseInt(event.currentTarget.dataset.page, 10);
    this.page = page;

    if (this.src) {
      this.reload();
    } else {
      this._render();
    }

    this.dispatchEvent(
      new CustomEvent('page-change', {
        detail: { page },
        bubbles: true,
      })
    );
  }

  _handleSearch(event) {
    clearTimeout(this._debounceTimer);
    
    this._debounceTimer = setTimeout(() => {
      this._searchTerm = event.target.value;
      this.page = 1;

      if (this.src) {
        this.reload();
      } else {
        this._render();
      }

      this.dispatchEvent(
        new CustomEvent('search', {
          detail: { term: this._searchTerm },
          bubbles: true,
        })
      );
    }, this.debounce);
  }

  _dispatchSelectionChange() {
    const selectedData = this._data.filter((row, index) => {
      const rowId = row[this.idField] ?? index;
      return this._selectedRows.has(rowId);
    });

    this.dispatchEvent(
      new CustomEvent('selection-change', {
        detail: {
          selectedIds: Array.from(this._selectedRows),
          selectedRows: selectedData,
        },
        bubbles: true,
      })
    );
  }

  // ==================== Public Methods ====================

  /** Clear all selected rows */
  clearSelection() {
    this._selectedRows.clear();
    this._updateSelection();
    this._dispatchSelectionChange();
  }

  /** Select all visible rows */
  selectAll() {
    this._data.forEach((row, index) => {
      const rowId = row[this.idField] ?? index;
      this._selectedRows.add(rowId);
    });
    this._updateSelection();
    this._dispatchSelectionChange();
  }

  /** Select specific rows by ID */
  selectRows(ids) {
    ids.forEach((id) => this._selectedRows.add(id));
    this._updateSelection();
    this._dispatchSelectionChange();
  }

  /** Deselect specific rows by ID */
  deselectRows(ids) {
    ids.forEach((id) => this._selectedRows.delete(id));
    this._updateSelection();
    this._dispatchSelectionChange();
  }

  /** Sort by column */
  sort(column, direction = 'asc') {
    this._sortColumn = column;
    this._sortDirection = direction;
    if (this.src) {
      this.reload();
    } else {
      this._render();
    }
  }

  /** Clear sorting */
  clearSort() {
    this._sortColumn = null;
    this._sortDirection = 'asc';
    if (this.src) {
      this.reload();
    } else {
      this._render();
    }
  }

  /** Re-render the table */
  refresh() {
    this._render();
  }

  /** Get selected row data */
  getSelectedData() {
    return this._data.filter((row, index) => {
      const rowId = row[this.idField] ?? index;
      return this._selectedRows.has(rowId);
    });
  }
}

/**
 * Column definition component for declarative table columns
 */
export class WcTableColumn extends HTMLElement {
  static get observedAttributes() {
    return ['key', 'label', 'sortable', 'width', 'align', 'format'];
  }

  constructor() {
    super();
    this._renderFn = null;
  }

  get key() {
    return this.getAttribute('key') || '';
  }

  set key(value) {
    this.setAttribute('key', value);
  }

  get label() {
    return this.getAttribute('label') || this.key;
  }

  set label(value) {
    this.setAttribute('label', value);
  }

  get sortable() {
    return this.hasAttribute('sortable');
  }

  set sortable(value) {
    if (value) {
      this.setAttribute('sortable', '');
    } else {
      this.removeAttribute('sortable');
    }
  }

  get format() {
    return this.getAttribute('format');
  }

  set format(value) {
    this.setAttribute('format', value);
  }

  /**
   * Set a custom render function for this column
   * @param {Function} fn - (value, row, index) => string | HTMLElement
   */
  setRenderFunction(fn) {
    this._renderFn = fn;
    // Notify parent table to re-render
    const table = this.closest('wc-table');
    if (table) {
      table._parseSlotColumns();
      table._render();
    }
  }
}

/**
 * Row element for declarative data definition
 * Use attributes to define row data: <wc-table-row name="John" email="john@example.com">
 */
export class WcTableRow extends HTMLElement {
  constructor() {
    super();
    this.style.display = 'none';
  }

  connectedCallback() {
    // Notify parent table to re-parse rows
    const table = this.closest('wc-table');
    if (table && table._initialized) {
      table._parseSlotRows();
      table._render();
    }
  }
}

/**
 * Cell element for declarative data with HTML content
 * <wc-table-row><wc-table-cell key="actions"><button>Edit</button></wc-table-cell></wc-table-row>
 */
export class WcTableCell extends HTMLElement {
  constructor() {
    super();
    this.style.display = 'none';
  }

  get key() {
    return this.getAttribute('key') || '';
  }

  set key(value) {
    this.setAttribute('key', value);
  }
}

export function defineWcTable() {
  if (!customElements.get('wc-table')) {
    customElements.define('wc-table', WcTable);
  }
  if (!customElements.get('wc-table-column')) {
    customElements.define('wc-table-column', WcTableColumn);
  }
  if (!customElements.get('wc-table-row')) {
    customElements.define('wc-table-row', WcTableRow);
  }
  if (!customElements.get('wc-table-cell')) {
    customElements.define('wc-table-cell', WcTableCell);
  }
}
