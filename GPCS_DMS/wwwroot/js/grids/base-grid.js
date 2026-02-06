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

            // Scrolling
            scrollingMode: options.scrollingMode || 'standard', // standard, virtual, infinite
            enableVirtualScrolling: options.enableVirtualScrolling ?? false,

            // Remote Operations
            remoteOperations: options.remoteOperations ?? false,

            // Editing
            enableEditing: options.enableEditing ?? false,
            editMode: options.editMode || 'row',

            // Delete confirmation (shared logic)
            enableConfirmDelete: options.enableConfirmDelete ?? false,
            deleteConfirmOptions: options.deleteConfirmOptions || null,

            // Export
            exportFileName: options.exportFileName || 'DataExport',

            // Callbacks
            onInitialized: options.onInitialized || null,
            onContentReady: options.onContentReady || null,
            onSelectionChanged: options.onSelectionChanged || null,
            onRowClick: options.onRowClick || null,
            onToolbarPreparing: options.onToolbarPreparing || null,
            onRowPrepared: options.onRowPrepared || null,
            onInitNewRow : options.onInitNewRow || null,
            // Advanced override: if provided, caller fully controls delete behavior
            onRowRemoving: options.onRowRemoving || null,

            // ...other passed

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
            // Appearance
            allowColumnReordering: this.options.allowColumnReordering,
            allowColumnResizing: this.options.allowColumnResizing,
            columnAutoWidth: this.options.columnAutoWidth ?? true,
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
            paging: this.options.enableVirtualScrolling ? {
                enabled: true,
                pageSize: this.options.pageSize || 50
            } : (this.options.enablePaging ? {
                pageSize: this.options.pageSize
            } : { enabled: false }),

            pager: this.options.enableVirtualScrolling ? {
                visible: false
            } : (this.options.enablePaging ? {
                visible: true,
                allowedPageSizes: this.options.pageSizes,
                showPageSizeSelector: true,
                showInfo: true,
                showNavigationButtons: true
            } : { visible: false }),

            // Scrolling
            scrolling: this.options.enableVirtualScrolling ? {
                mode: this.options.scrollingMode || 'virtual',
                rowRenderingMode: 'virtual',
                showScrollbar: 'always',
                preloadEnabled: true
            } : {
                mode: 'standard'
            },

            // Remote Operations
            remoteOperations: this.options.remoteOperations,

            // Filters
            filterRow: this.options.enableFilterRow ? {
                visible: true,
                applyFilter: 'auto',
            } : { visible: false },

            headerFilter: this.options.enableHeaderFilter ? {
                allowSelectAll: true,
                search: {
                    enabled: true,
                },
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
                mode: 'select',
                search:{
                    enabled: true
                },
                height: 400,
                width: 300,
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
            editing: this.options.editing || (this.options.enableEditing ? {
                mode: this.options.editMode || 'row',
                allowUpdating: true,
                allowDeleting: true,
                allowAdding: true,
                useIcons: true
            } : {
                allowUpdating: false,
                allowDeleting: false,
                allowAdding: false
            }),
            // Height
            height: this.options.height || undefined,

            // Other features
            sorting: { mode: 'multiple' },
            columnFixing: { enabled: true },
            loadPanel: { enabled: false },

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
            },

            onRowPrepared: (e) => {
                if(this.options.onRowPrepared) {
                    this.options.onRowPrepared(e);
                }
            },

            onInitNewRow: (e) => {
                if(this.options.onInitNewRow) {
                    this.options.onInitNewRow(e);
                }
            },

            onRowRemoving: (e) => {
                const grid = e.component;

                // If user supplied a custom handler, let them own the behavior
                if (this.options.onRowRemoving) {
                    this.options.onRowRemoving(e);
                    return;
                }

                // If shared confirm-delete is not enabled, do nothing
                if (!this.options.enableConfirmDelete) {
                    return;
                }

                // Prevent recursion when we call deleteRow programmatically
                if (grid.__skipDeleteConfirm) {
                    grid.__skipDeleteConfirm = false;
                    return;
                }

                // Cancel default delete; we'll decide after dialog
                e.cancel = true;

                if (grid.__isDeletingWithConfirm) {
                    return;
                }
                grid.__isDeletingWithConfirm = true;

                const defaultOptions = {
                    title: 'Confirm Delete',
                    message: 'Are you sure you want to delete this record?',
                    type: 'warning',
                    okText: 'Delete',
                    cancelText: 'Cancel'
                };

                const dialogOptions = {
                    ...defaultOptions,
                    ...(this.options.deleteConfirmOptions || {})
                };

                this.dialog.confirm(dialogOptions)
                    .then((confirmed) => {
                        if (!confirmed) {
                            return;
                        }

                        const rowIndex = typeof e.rowIndex === 'number'
                            ? e.rowIndex
                            : grid.getRowIndexByKey(e.key);

                        if (rowIndex >= 0) {
                            grid.__skipDeleteConfirm = true;
                            grid.deleteRow(rowIndex);
                        }
                    })
                    .finally(() => {
                        grid.__isDeletingWithConfirm = false;
                    });
            }
        };
    }

    /**
     * Prepare toolbar
     */
    _prepareToolbar(e) {
        this.toolbarManager.prepareToolbar(e, {
            onRefresh: () => this._handleRefresh(),
            onClearFilters: () => this._handlerClearFilters(),
            onResetState: () => this._handleResetState()
        });

        setTimeout(() => {
            if (this.toolbarManager) {
                this.toolbarManager.updateTotalCount();
            }
        }, 200);
    }

    async _handleRefresh() {
        const confirm = await this.dialog.confirm({
            title: 'Refresh Grid',
            message: 'Are you sure you want to refresh the grid data?',
            okText: 'Yes',
            cancelText: 'No'
        });

        if (confirm) {
            this.refresh();
        }
    }

    async _handlerClearFilters() {
        const confirm = await this.dialog.confirm({
            title: 'Clear Filters',
            message: 'Are you sure you want to clear all filters?',
            okText: 'Yes',
            cancelText: 'No'
        });

        if (confirm) {
            this.clearFilters();
        }
    }

    async _handleResetState() {
        const confirm = await this.dialog.confirm({
            title: 'Reset Grid State',
            message: 'Are you sure you want to reset all grid settings (columns, filters, sorting)?',
            okText: 'Yes',
            cancelText: 'No'
        });

        if (confirm) {
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
            dataField: '__rowNumber',
            width: 60,
            allowFiltering: false,
            allowSorting: false,
            allowReordering: false,
            allowGrouping: false,
            allowHeaderFiltering: false,
            allowExporting: false,
            allowEditing: false,
            formItem: { visible: false },
            fixed: true,
            fixedPosition: 'left',
            cellTemplate: (container, options) => {
                $('<div>')
                    .css({
                        textAlign: 'center',
                        color: '#666',
                        fontSize: '12px',
                        fontWeight: '500'
                    })
                    .text(options.value || options.rowIndex + 1)
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

    async clearFilters() {
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
}

// Make it available globally
window.BaseGrid = BaseGrid;
