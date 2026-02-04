class BaseGrid {
    constructor(options = {}) {
        this.dialog = appDialog;
        this.loading = appLoading;
        this.notification = appNotification;
        this.gridId = options.gridId || 'defaultGrid';
        
        // Default options
        this.options = {
            container: options.container || '#gridContainer',
            dataSource: options.dataSource || [],
            columns: options.columns || [],
            keyExpr: options.keyExpr || 'id',
            
            // Appearance
            allowColumnReordering: options.allowColumnReordering ?? true,
            allowColumnResizing: options.allowColumnResizing ?? true,
            columnAutoWidth: options.columnAutoWidth ?? true,
            showBorders: options.showBorders ?? true,
            showRowLines: options.showRowLines ?? true,
            showColumnLines: options.showColumnLines ?? true,
            rowAlternationEnabled: options.rowAlternationEnabled ?? true,
            hoverStateEnabled: options.hoverStateEnabled ?? true,
            wordWrapEnabled: options.wordWrapEnabled ?? false,
            
            // Features
            enableStateStorage: options.enableStateStorage ?? true,
            enableExport: options.enableExport ?? true,
            enableFilterRow: options.enableFilterRow ?? true,
            enableFilterPanel: options.enableFilterPanel ?? true,
            enableHeaderFilter: options.enableHeaderFilter ?? true,
            enableSearchPanel: options.enableSearchPanel ?? true,
            enableColumnChooser: options.enableColumnChooser ?? true,
            enableGrouping: options.enableGrouping ?? false,
            enableSelection: options.enableSelection ?? true,
            selectionMode: options.selectionMode || 'multiple',
            enableRowNumber: options.enableRowNumber ?? true,
            
            // Paging
            enablePaging: options.enablePaging ?? true,
            pageSize: options.pageSize || 20,
            pageSizes: options.pageSizes || [10, 20, 50, 100, 'all'],
            
            // Editing
            enableEditing: options.enableEditing ?? false,
            editMode: options.editMode || 'row',
            
            // Export
            exportFileName: options.exportFileName || 'DataExport',
            
            // Callbacks
            onInitialized: options.onInitialized || null,
            onContentReady: options.onContentReady || null,
            onSelectionChanged: options.onSelectionChanged || null,
            onRowClick: options.onRowClick || null,
            onToolbarPreparing: options.onToolbarPreparing || null,
            
            ...options
        };

        this.gridInstance = null;
        
        // Managers
        this.stateManager = new GridStateManager(this.gridId, this.options.enableStateStorage);
        this.exportManager = null;
        this.toolbarManager = null;
    }

    /**
     * Initialize grid
     */
    initialize() {
        // Show loading
        if (this.loading) {
            this.loading.show('Initializing grid...');
        }

        const config = this._buildConfig();
        $(this.options.container).dxDataGrid(config);

        // Hide loading
        setTimeout(() => {
            if (this.loading) {
                this.loading.hide();
            }
        }, 500);

        return this;
    }

    /**
     * Build grid configuration
     */
    _buildConfig() {
        const columns = this.options.enableRowNumber 
            ? [this._createRowNumberColumn(), ...this.options.columns]
            : this.options.columns;

        return {
            dataSource: this.options.dataSource,
            columns: columns,
            keyExpr: this.options.keyExpr,
            
            // Appearance
            allowColumnReordering: this.options.allowColumnReordering,
            allowColumnResizing: this.options.allowColumnResizing,
            columnAutoWidth: this.options.columnAutoWidth,
            showBorders: this.options.showBorders ?? true,
            showRowLines: this.options.showRowLines ?? true,
            showColumnLines: this.options.showColumnLines,
            rowAlternationEnabled: this.options.rowAlternationEnabled,
            hoverStateEnabled: this.options.hoverStateEnabled,
            wordWrapEnabled: this.options.wordWrapEnabled,
            
            // State storage
            stateStoring: this.options.enableStateStorage ? {
                enabled: true,
                type: 'custom',
                customLoad: () => this.stateManager.load(),
                customSave: (state) => this.stateManager.save(state)
            } : { enabled: false },
            
            // Selection
            selection: this.options.enableSelection ? {
                mode: this.options.selectionMode,
                showCheckBoxesMode: this.options.selectionMode === 'multiple' ? 'always' : 'none',
                allowSelectAll: this.options.selectionMode === 'multiple'
            } : { mode: 'none' },
            
            // Paging
            paging: this.options.enablePaging ? {
                pageSize: this.options.pageSize
            } : { enabled: false },
            
            pager: this.options.enablePaging ? {
                visible: true,
                allowedPageSizes: this.options.pageSizes,
                showPageSizeSelector: true,
                showInfo: true,
                showNavigationButtons: true
            } : { visible: false },
            
            // Filters
            filterRow: this.options.enableFilterRow ? {
                visible: true,
                applyFilter: 'auto'
            } : { visible: false },
            
            headerFilter: this.options.enableHeaderFilter ? {
                visible: true
            } : { visible: false },
            
            filterPanel: this.options.enableFilterPanel ? {
                visible: true
            } : { visible: false },
            
            searchPanel: this.options.enableSearchPanel ? {
                visible: true,
                width: 240,
                placeholder: 'Search...'
            } : { visible: false },
            
            columnChooser: this.options.enableColumnChooser ? {
                enabled: true,
                mode: 'select'
            } : { enabled: false },
            
            // Grouping
            groupPanel: this.options.enableGrouping ? {
                visible: true,
                emptyPanelText: 'Drag a column header here to group by that column'
            } : { visible: false },
            
            grouping: this.options.enableGrouping ? {
                autoExpandAll: false,
                allowCollapsing: true
            } : { autoExpandAll: false },
            
            // Export
            export: this.options.enableExport ? {
                enabled: true,
                allowExportSelectedData: true
            } : { enabled: false },
            
            // Editing
            editing: this.options.enableEditing ? {
                mode: this.options.editMode,
                allowUpdating: true,
                allowDeleting: true,
                allowAdding: true
            } : { 
                allowUpdating: false, 
                allowDeleting: false, 
                allowAdding: false 
            },
            
            // Height
            height: this.options.height || undefined,
            
            // Other features
            sorting: { mode: 'multiple' },
            columnFixing: { enabled: true },
            loadPanel: { enabled: true },
            
            // Events
            onInitialized: (e) => {
                this.gridInstance = e.component;
                this.exportManager = new GridExportManager(this.gridInstance, {
                    exportFileName: this.options.exportFileName
                });
                this.toolbarManager = new GridToolbarManager(this.gridInstance, this.options);
                
                if (this.options.onInitialized) {
                    this.options.onInitialized(e);
                }
            },
            
            onContentReady: (e) => {
                if (this.toolbarManager) {
                    this.toolbarManager.updateTotalCount();
                }
                
                if (this.options.onContentReady) {
                    this.options.onContentReady(e);
                }
            },
            
            onSelectionChanged: (e) => {
                if (this.options.onSelectionChanged) {
                    this.options.onSelectionChanged(e);
                }
            },
            
            onRowClick: (e) => {
                if (this.options.onRowClick) {
                    this.options.onRowClick(e);
                }
            },
            
            onToolbarPreparing: (e) => {
                this._prepareToolbar(e);
                if (this.options.onToolbarPreparing) {
                    this.options.onToolbarPreparing(e);
                }
            },
            
            onExporting: (e) => {
                this.exportManager.exportAll(e);
            }
        };
    }

    /**
     * Prepare toolbar
     */
    _prepareToolbar(e) {
        this.toolbarManager.prepareToolbar(e, {
            onRefresh: () => this.refresh(),
            onClearFilters: () => this.clearFilters(),
            onResetState: () => this._handleResetState()
        });
        
        setTimeout(() => {
            if (this.toolbarManager) {
                this.toolbarManager.updateTotalCount();
            }
        }, 200);
    }

    /**
     * Handle Reset State button
     */
    _handleResetState() {
        if (confirm('Reset all grid settings (columns, filters, sorting)?')) {
            this.resetState();
            this.clearFilters();
            this.clearSelection();
        }
    }

    /**
     * Row Number column
     */
    _createRowNumberColumn() {
        return {
            caption: '#',
            width: 60,
            allowFiltering: false,
            allowSorting: false,
            allowReordering: false,
            allowGrouping: false,
            allowHeaderFiltering: false,
            allowExporting: false,
            fixed: true,
            fixedPosition: 'left',
            cellTemplate: (container, options) => {
                const pageIndex = this.gridInstance ? this.gridInstance.pageIndex() : 0;
                const pageSize = this.gridInstance ? this.gridInstance.pageSize() : 20;
                const rowNumber = (pageIndex * pageSize) + options.rowIndex + 1;
                
                $('<div>')
                    .css({
                        textAlign: 'center',
                        color: '#666',
                        fontSize: '12px'
                    })
                    .text(rowNumber)
                    .appendTo(container);
            }
        };
    }

    // =============== Public Methods ===============

    refresh() {
        if (!this.gridInstance) return;
        this.gridInstance.refresh();
        
        setTimeout(() => {
            if (this.toolbarManager) {
                this.toolbarManager.updateTotalCount();
            }
        }, 300);
        
        this.notification.show('Grid refreshed', 'success', { duration: 1000 });
    }

    clearFilters() {
        if (!this.gridInstance) return;
        this.gridInstance.clearFilter();
        this.notification.show('Filters cleared', 'success', { duration: 1000 });
    }

    clearSelection() {
        if (!this.gridInstance) return;
        this.gridInstance.clearSelection();
    }

    getSelectedRows() {
        if (!this.gridInstance) return [];
        return this.gridInstance.getSelectedRowsData();
    }

    selectRows(keys) {
        if (!this.gridInstance) return;
        this.gridInstance.selectRows(keys, false);
    }

    resetState() {
        if (!this.gridInstance) return;
        this.stateManager.clear();
        this.gridInstance.state(null);
        this.notification.show('Grid state reset', 'success');
    }

    getInstance() {
        return this.gridInstance;
    }

    getAllData() {
        if (!this.gridInstance) return [];
        return this.gridInstance.getDataSource().items();
    }

    updateDataSource(dataSource) {
        if (!this.gridInstance) return;
        this.gridInstance.option('dataSource', dataSource);
    }

    search(text) {
        if (!this.gridInstance) return;
        this.gridInstance.searchByText(text);
    }

    clearSearch() {
        if (!this.gridInstance) return;
        this.gridInstance.searchByText('');
    }

    toggleColumn(columnName, visible) {
        if (!this.gridInstance) return;
        this.gridInstance.columnOption(columnName, 'visible', visible);
    }

    getState() {
        if (!this.gridInstance) return null;
        return this.gridInstance.state();
    }

    setState(state) {
        if (!this.gridInstance) return;
        this.gridInstance.state(state);
    }

    dispose() {
        if (this.gridInstance) {
            this.gridInstance.dispose();
            this.gridInstance = null;
        }
    }

    // =============== Helper Functions ===============

    static createColumn(dataField, caption, options = {}) {
        return { dataField, caption, ...options };
    }

    static createLookupColumn(dataField, caption, lookupDataSource, displayExpr, valueExpr, options = {}) {
        return {
            dataField,
            caption,
            lookup: {
                dataSource: lookupDataSource,
                displayExpr: displayExpr,
                valueExpr: valueExpr
            },
            ...options
        };
    }

    static createDateColumn(dataField, caption, format = 'dd/MM/yyyy', options = {}) {
        return {
            dataField,
            caption,
            dataType: 'date',
            format: format,
            ...options
        };
    }

    static createNumberColumn(dataField, caption, format = '#,##0.##', options = {}) {
        return {
            dataField,
            caption,
            dataType: 'number',
            format: format,
            ...options
        };
    }

    static createBooleanColumn(dataField, caption, options = {}) {
        return {
            dataField,
            caption,
            dataType: 'boolean',
            ...options
        };
    }
}

// Make it available globally
window.BaseGrid = BaseGrid;
