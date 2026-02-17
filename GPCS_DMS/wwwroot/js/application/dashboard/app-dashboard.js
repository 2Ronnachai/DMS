class AppDashboard {
    constructor() {
        this.http = Http;
        this.utils = Utils;
        this.dialog = appDialog;
        this.loading = appLoading;
        this.notify = appNotification;

        // DOM Elements
        this.container = document.getElementById('dashboard-application-grid');
        this.containerWrapper = document.querySelector('.application-grid-container');
        this.summaryContainer = document.getElementById('dashboard-summary-container');
        this.filterPanel = document.getElementById('dashboard-filter-panel');
        this.filterToggleBtn = document.getElementById('filter-toggle-btn');
        this.headerActions = document.getElementById('dashboard-header-actions');

        // Services
        this.service = new DashboardService(this);
        this.config = DashboardConfig;
        this.renderer = new DashboardRenderer(this.config);

        // State
        this.currentActive = null;
        this.role = null;
        this.summary = {};
        this.applications = [];
        this.applicationTypes = [];

        // Grid Instance
        this.gridInstance = null;

        // Empty state container (separate from grid container)
        this.emptyStateContainer = null;

        // Filter Controls
        this.filterControls = null;

        // Prevent rapid card switching (avoid concurrent loads)
        this._isSwitchingCard = false;
        this._pendingCardKey = null;

        // Header create button state
        this._headerCreate = {
            container: null,
            dropdown: null,
            isBound: false,
            onDocClick: null,
        };
    }

    normalizeRole(role) {
        return (role || '').toString().trim().toLowerCase();
    }

    canCreateNew() {
        const buttonConfig = this.config?.TOOLBAR?.CREATE_BUTTON;
        if (!buttonConfig?.enabled) return false;

        const normalizedRole = this.normalizeRole(this.role);
        const exclude = Array.isArray(buttonConfig.excludeRoles) ? buttonConfig.excludeRoles : [];
        return !exclude.map(r => this.normalizeRole(r)).includes(normalizedRole);
    }

    clearHeaderCreateButton() {
        if (!this.headerActions) return;
        this.headerActions.innerHTML = '';
        this._headerCreate.container = null;
        this._headerCreate.dropdown = null;

        if (this._headerCreate.isBound && this._headerCreate.onDocClick) {
            document.removeEventListener('click', this._headerCreate.onDocClick, true);
            this._headerCreate.isBound = false;
            this._headerCreate.onDocClick = null;
        }
    }

    renderHeaderCreateButton() {
        if (!this.headerActions) return;

        // Always reset to avoid duplicates after reload
        this.clearHeaderCreateButton();

        if (!this.canCreateNew()) return;
        if (!this.applicationTypes || !this.applicationTypes.length) return;

        const buttonConfig = this.config.TOOLBAR.CREATE_BUTTON;

        const container = document.createElement('div');
        container.className = 'toolbar-create-container';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'toolbar-btn toolbar-btn--primary';
        button.innerHTML = `<i class="${buttonConfig.icon}"></i> ${buttonConfig.label} <i class="${buttonConfig.dropdownIcon}"></i>`;

        const dropdown = document.createElement('div');
        dropdown.className = 'toolbar-dropdown';
        dropdown.style.display = 'none';

        this.applicationTypes.forEach(type => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'toolbar-dropdown-item';
            item.innerHTML = `<i class="${buttonConfig.itemIcon}"></i> ${type.displayName}`;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = 'none';
                this.handleCreateNew(type);
            });
            dropdown.appendChild(item);
        });

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? '' : 'none';
        });

        container.appendChild(button);
        container.appendChild(dropdown);
        this.headerActions.appendChild(container);

        // Close on outside click (capture phase so it runs early)
        const onDocClick = (e) => {
            if (!container.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        };
        document.addEventListener('click', onDocClick, true);

        this._headerCreate.container = container;
        this._headerCreate.dropdown = dropdown;
        this._headerCreate.isBound = true;
        this._headerCreate.onDocClick = onDocClick;
    }

    setSummaryCardsEnabled(enabled) {
        if (!this.summaryContainer) return;
        this.summaryContainer.style.pointerEvents = enabled ? '' : 'none';
        this.summaryContainer.style.cursor = enabled ? '' : 'wait';
    }

    async switchToCard(key) {
        if (!key || key === this.currentActive) return;

        // If a switch is already in progress, remember the latest request
        if (this._isSwitchingCard) {
            this._pendingCardKey = key;
            return;
        }

        this._isSwitchingCard = true;
        this._pendingCardKey = null;
        this.setSummaryCardsEnabled(false);

        try {
            this.currentActive = key;
            this.renderer.highlightActiveCard(this.summaryContainer, this.currentActive);

            // Clear filter panel
            this.resetFilters();

            // Load applications for the selected card
            await this.loadApplications(key);
        } finally {
            this._isSwitchingCard = false;
            this.setSummaryCardsEnabled(true);

            // If user clicked another card while loading, switch once more (latest wins)
            const pending = this._pendingCardKey;
            this._pendingCardKey = null;
            if (pending && pending !== this.currentActive) {
                // Fire-and-forget; it re-enters with the lock cleared
                this.switchToCard(pending);
            }
        }
    }

    getAllowedKeysForRole(role) {
        const normalizedRole = (role || '').toString().trim().toLowerCase();
        if (!normalizedRole) return [];

        const mapping = this.config?.ROLE_CARD_MAPPING;
        if (!mapping) return [];

        const keys = mapping[normalizedRole];
        return Array.isArray(keys) ? keys : [];
    }

    resolveFirstTabForRole(role) {
        const allowedKeys = this.getAllowedKeysForRole(role);
        return allowedKeys.length ? allowedKeys[0] : null;
    }

    hideDashboardUiWhenNoRole() {
        if (this.summaryContainer) {
            this.summaryContainer.innerHTML = '';
            this.summaryContainer.style.display = 'none';
        }

        this.clearHeaderCreateButton();

        document.querySelector('.filter-panel-container')?.setAttribute('style', 'display:none');

        if (this.containerWrapper) {
            this.containerWrapper.style.display = 'none';
        }
    }

    showNoAccessState() {
        if (this.summaryContainer) {
            this.summaryContainer.style.display = 'none';
        }

        this.clearHeaderCreateButton();

        const filterPanelContainer = document.querySelector('.filter-panel-container');
        if (filterPanelContainer) filterPanelContainer.style.display = 'none';

        // Ensure the grid wrapper remains visible so the message can use full space
        if (this.containerWrapper) {
            this.containerWrapper.style.display = '';
        }

        this.currentActive = 'noAccess';
        const emptyEl = this.ensureEmptyStateContainer();
        if (!emptyEl) return;

        if (this.container) this.container.style.display = 'none';
        emptyEl.style.display = 'flex';
        this.renderer.renderEmpty(emptyEl, 'noAccess');
    }

    ensureEmptyStateContainer() {
        if (this.emptyStateContainer) return this.emptyStateContainer;

        const parent = this.containerWrapper || this.container?.parentElement;
        if (!parent) return null;

        let el = parent.querySelector('.dashboard-empty-state-container');
        if (!el) {
            el = document.createElement('div');
            el.className = 'dashboard-empty-state-container';
            el.style.display = 'none';
            parent.appendChild(el);
        }

        this.emptyStateContainer = el;
        return el;
    }

    showEmptyState() {
        const emptyEl = this.ensureEmptyStateContainer();
        if (!emptyEl) return;

        if (this.container) this.container.style.display = 'none';
        emptyEl.style.display = 'flex';
        this.renderer.renderEmpty(emptyEl, this.currentActive);
    }

    hideEmptyState() {
        const emptyEl = this.ensureEmptyStateContainer();
        if (emptyEl) {
            emptyEl.style.display = 'none';
            emptyEl.innerHTML = '';
        }
        if (this.container) this.container.style.display = '';
    }

    // Initialize the dashboard
    async init() {
        const loadingId = this.loading.show('Loading dashboard...');
        try {
            await Promise.all([
                this.loadRoleWithSummary(),
                this.loadApplicationTypes(),
            ]);

            // If role is missing, do not render the dashboard (avoid null currentActive errors)
            if (!this.role) {
                this.showNoAccessState();
                return;
            }

            // Always default currentActive to the first tab from config for this role
            this.currentActive = this.resolveFirstTabForRole(this.role);
            if (!this.currentActive) {
                this.showNoAccessState();
                return;
            }

            // Setup UI
            this.renderSummaryCards();
            this.renderHeaderCreateButton();
            this.initFilterPanel();
            this.createGrid();

            // Load applications for the current active card
            await this.loadApplications(this.currentActive);

            // Setup Event Listeners
            this.setUpEventListeners();

        } catch (error) {
            this.notify.error('Failed to initialize dashboard: ' + error.message);
        } finally {
            this.loading.hide(loadingId);
        }
    }

    async reloadData() {
        try {
            await this.loadRoleWithSummary();
            this.renderer.updateSummaryValues(this.summaryContainer, this.summary);
            this.renderHeaderCreateButton();
            await this.loadApplications(this.currentActive);
        } catch (error) {
            this.notify.error('Failed to reload dashboard data: ' + error.message);
            console.error('Error reloading dashboard data:', error);
        }
    }

    async loadRoleWithSummary() {
        const data = await this.service.getRoleWithSummary();
        if (data) {
            this.role = data.role || null;
            this.summary = data.summary || {};
            return;
        }

        this.role = null;
        this.summary = {};
    }

    async loadApplicationTypes() {
        const types = await this.service.getApplicationTypes();
        if (types && Array.isArray(types)) {
            this.applicationTypes = types;
            return;
        }

        this.applicationTypes = [
            { id: 1, name: 'Type A', displayName: 'Type A' },
            { id: 2, name: 'Type B', displayName: 'Type B' },
        ];
    }

    async loadApplications(key) {
        if (!key) {
            this.applications = [];
            this.updateGrid();
            return;
        }

        this.applications = await this.service.loadApplications(key);
        this.updateGrid();
    }

    renderSummaryCards() {
        this.renderer.renderSummaryCard(
            this.summaryContainer,
            this.summary,
            this.role,
            this.currentActive
        );
    }

    initFilterPanel() {
        // Setup toggle button
        if (this.filterToggleBtn && this.filterPanel) {
            this.filterToggleBtn.addEventListener('click', () => {
                this.filterPanel.classList.toggle('filter-panel--collapsed');
                const icon = this.filterToggleBtn.querySelector('.filter-toggle-icon');
                icon?.classList.toggle('fa-chevron-down');
                icon?.classList.toggle('fa-chevron-up');
            });
        }

        // Get filter controls
        this.filterControls = {
            applyBtn: document.getElementById('filter-apply-btn'),
            resetBtn: document.getElementById('filter-reset-btn'),
        };

        // Initialize DevExtreme TextBox
        this.filterControls.textSearch = $('#filter-text-search').dxTextBox({
            placeholder: 'Search application number or name...',
            value: '',
        }).dxTextBox('instance');

        // Initialize DevExtreme SelectBox
        this.filterControls.applicationType = $('#filter-application-type').dxSelectBox({
            placeholder: 'All types',
            dataSource: this.applicationTypes,
            displayExpr: 'displayName',
            valueExpr: 'name',
            value: null,
        }).dxSelectBox('instance');

        // Initialize DevExtreme DateBox
        this.filterControls.dateFrom = $('#filter-date-from').dxDateBox({
            type: 'date',
            placeholder: 'Select date',
            displayFormat: 'dd/MM/yyyy',
            acceptCustomValue: false,
            value: null,
            showClearButton: true,
            openOnFieldClick: true,
        }).dxDateBox('instance');

        this.filterControls.dateTo = $('#filter-date-to').dxDateBox({
            type: 'date',
            placeholder: 'Select date',
            acceptCustomValue: false,
            displayFormat: 'dd/MM/yyyy',
            value: null,
            showClearButton: true,
            openOnFieldClick: true,
        }).dxDateBox('instance');

        // onValueChanged event box
        this.setUpFilterListeners();
    }

    setUpFilterListeners() {
        if (!this.filterControls) return;

        const { textSearch, applicationType, dateFrom, dateTo, applyBtn, resetBtn } = this.filterControls;
        const onFilterChange = () => this.applyFilterAndUpdateGrid();

        // textSearch Enter key with debounce
        let debounceTimeout = null;
        textSearch.on('valueChanged', (e) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                onFilterChange();
            }, 300);
        });

        // textSearch Enter key
        textSearch.on('enterKey', (e) => {
            onFilterChange();
        });

        [applicationType, dateFrom, dateTo].forEach(control => {
            control.on('valueChanged', (e) => {
                onFilterChange();
            });
        });

        // Apply button
        applyBtn?.addEventListener('click', () => {
            onFilterChange();
        });

        // Reset button
        resetBtn?.addEventListener('click', () => {
            this.resetFilters();
        });
    }

    resetFilters() {
        if (!this.filterControls) return;
        const { textSearch, applicationType, dateFrom, dateTo } = this.filterControls;
        textSearch.option('value', '');
        applicationType.option('value', null);
        dateFrom.option('value', null);
        dateTo.option('value', null);
    }

    setUpEventListeners() {
        // Summary Card Click
        if (this.summaryContainer) {
            this.summaryContainer.addEventListener('click', async (e) => {
                const card = e.target.closest('.summary-card[data-key]');
                if (!card) return;

                const key = card.dataset.key;
                await this.switchToCard(key);
            });
        }
    }

    createGrid() {
        if (!this.container || !window.BaseGrid) {
            console.error('Cannot create grid: container or BaseGrid not found.');
            return;
        }

        const typeMap = Object.fromEntries(
            this.applicationTypes.map(type => [type.id, type.displayName])
        );

        const columns = this.config.GRID_COLUMNS.map(col => {
            const column = { ...col };

            // Custom cell template
            if (col.dataField === 'applicationStatus') {
                column.cellTemplate = (container, options) => {
                    const cfg = this.renderer.getStatusConfig(options.value);
                    $('<span>')
                        .addClass(`status-badge status-${cfg.class}`)
                        .text(cfg.label || options.value)
                        .appendTo(container);
                };
            } else if (col.dataField === 'isUrgent') {
                column.cellTemplate = (container, options) => {
                    // add badge for urgent
                    if (options.value) {
                        $('<span>')
                            .addClass('urgent-badge')
                            .text('Urgent')
                            .appendTo(container);
                    }
                };
            }
            return column;
        });

        this.gridInstance = new BaseGrid({
            gridId: 'dashboardApplications',
            container: '#dashboard-application-grid',
            dataSource: [],
            columns: columns,
            height: '100%',
            enableExport: false,
            exportFileName: 'ApplicationsDashboard',
            enableFilterRow: true,
            enableFilterPanel: true,
            enableHeaderFilter: true,
            showBorders: true,
            hoverStateEnabled: true,
            enableStateStorage: false,
            rowAlternationEnabled: false,

            // Virtual Scrolling
            enableVirtualScrolling: true,
            scrollingMode: 'virtual',
            // Paging
            enablePaging: true,
            pageSize: 50,

            onToolbarPreparing: (e) => this.customizeToolbar(e),
            onRowPrepared: (e) => {
                if (e.rowType === 'data') {
                    e.rowElement.css('cursor', 'pointer');
                }
            },
            onRowClick: (e) => {
                if (e.rowType === 'data') {
                    this.handleOnRowClick(e);
                }
            }
        });
        this.gridInstance.initialize();
    }

    customizeToolbar(e) {
        if (!e || !e.toolbarOptions) return;

        const toolbar = e.toolbarOptions;

        // Remove default items
        toolbar.items = toolbar.items.filter(item => {
            return !(item.location === 'before' && typeof item.template === 'function');
        });

        // Add Create New Application Button
        this._addCreateButton(toolbar);
    }

    _addCreateButton(toolbar) {
        const buttonConfig = this.config.TOOLBAR.CREATE_BUTTON;

        if (!buttonConfig.enabled) return;
        const normalizedRole = this.normalizeRole(this.role);
        if ((buttonConfig.excludeRoles || []).map(r => this.normalizeRole(r)).includes(normalizedRole)) return;

        toolbar.items.unshift({
            location: 'before',
            template: (data, index, element) => {
                const $container = $('<div>').addClass('toolbar-create-container');

                const $button = $('<button>')
                    .attr('type', 'button')
                    .addClass('toolbar-btn toolbar-btn--primary')
                    .html(`<i class="${buttonConfig.icon}"></i> ${buttonConfig.label} <i class="${buttonConfig.dropdownIcon}"></i>`)
                    .on('click', (e) => {
                        e.stopPropagation();
                        $dropdown.toggle();
                    });

                const $dropdown = $('<div>')
                    .addClass('toolbar-dropdown')
                    .css('display', 'none');

                this.applicationTypes.forEach(type => {
                    const $item = $('<button>')
                        .attr('type', 'button')
                        .addClass('toolbar-dropdown-item')
                        .html(`<i class="${buttonConfig.itemIcon}"></i> ${type.displayName}`)
                        .on('click', () => {
                            $dropdown.hide();
                            this.handleCreateNew(type);
                        });
                    $dropdown.append($item);
                });

                $(document).on('click', (e) => {
                    if (!$(e.target).closest('.toolbar-create-container').length) {
                        $dropdown.hide();
                    }
                });

                $container.append($button).append($dropdown);
                $(element).append($container);
            }
        });
    }

    handleCreateNew(applicationType) {
        // New tab with applicationType
        const url = `${window.APP_CONFIG?.host}Application/SetApplicationType?applicationType=${applicationType.name}`;
        window.open(url, '_blank');
    }

    handleOnRowClick(e) {
        if (e.rowType === 'data') {
            var url = `${window.APP_CONFIG?.host}Application/SetApplicationType?applicationType=${e.data.applicationType}&id=${e.data.id}`;
            window.location.href = url;
        }
    }

    applyFilterAndUpdateGrid() {
        if (!this.gridInstance || !this.filterControls) return;

        const data = this.getFilteredApplications();
        const items = data || [];

        if (items.length === 0) {
            this.showEmptyState();
        } else {
            this.hideEmptyState();
        }

        this.gridInstance.updateDataSource(items);
    }

    updateGrid() {
        const items = this.applications || [];

        // Ensure grid exists once; do not destroy its DOM for empty state
        if (!this.gridInstance) {
            this.createGrid();
        }

        if (items.length === 0) {
            this.showEmptyState();
            // Keep grid instance alive; just clear its data
            this.gridInstance?.updateDataSource([]);
            return;
        }

        this.hideEmptyState();
        this.gridInstance.updateDataSource(items);
    }

    getCurrentFilters() {
        if (!this.filterControls) return null;

        return {
            textSearch: this.filterControls.textSearch?.option('value') || '',
            applicationType: this.filterControls.applicationType?.option('value') || null,
            dateFrom: this.filterControls.dateFrom?.option('value') || null,
            dateTo: this.filterControls.dateTo?.option('value') || null,
        };
    }

    getFilteredApplications() {
        const items = this.applications || [];
        if (!items.length) return [];

        const { textSearch, applicationType, dateFrom, dateTo } = this.getCurrentFilters();

        const textValue = textSearch?.trim().toLowerCase() || '';
        const typeValue = applicationType;
        const fromDate = dateFrom;
        const toDate = dateTo;

        const fromData = fromDate ? new Date(fromDate.setHours(0, 0, 0, 0)) : null;
        const toData = toDate ? new Date(toDate.setHours(23, 59, 59, 999)) : null;
        console.log('Filtering applications with:', {
            textValue,
            typeValue,
            fromData,
            toData
        });

        return items.filter(item => {
            if (typeValue && item.applicationType !== typeValue) {
                return false;
            }

            if (fromData || toData) {
                const created = item.createdAt ? new Date(item.createdAt) : null;
                if (created) {
                    if (fromData && created < fromData) {
                        return false;
                    }
                    if (toData && created > toData) {
                        return false;
                    }
                }
            }

            if (textValue) {
                const haystack = [
                    item.applicationNumber,
                    item.supplierName,
                    item.supplierCode,
                    item.requestor
                ].filter(Boolean).join(' ').toLowerCase();

                if (!haystack.includes(textValue)) {
                    return false;
                }
            }

            return true;
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.appDashboard = new AppDashboard();
    window.appDashboard.init();
});