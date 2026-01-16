class AppGrid {
    constructor(appMain, applicationData) {
        this.appMain = appMain;
        this.data = applicationData;
        this.container = document.getElementById('itemsSection');

        this.gridInstance = null;

        this._isDeleting = false;
        this._isDeletingSelected = false;
    }

    _getGridConfigurations() {
        const configuration = {
            'newmaterialsitems': {
                'create': {
                    columns: this._getNewMaterialItemColumns(true),
                    toolbar: this._getToolbarOptions(),
                    editing: {
                        mode: 'row',
                        useIcons: true,
                        allowUpdating: false,
                        allowDeleting: false,
                        allowAdding: false,
                        confirmDelete: false,
                    },
                    selection: {
                        mode: 'multiple',
                        showCheckBoxesMode: 'always'
                    },
                    // onRowRemoving: (e) => this._confirmDelete(e),
                },
                'edit': {
                    columns: this._getNewMaterialItemColumns(true),
                    toolbar: this._getToolbarOptions(),
                    editing: {
                        mode: 'row',
                        useIcons: true,
                        allowUpdating: false,
                        allowDeleting: false,
                        allowAdding: false,
                        confirmDelete: false
                    },
                    selection: {
                        mode: 'multiple',
                        showCheckBoxesMode: 'always'
                    },
                    // onRowRemoving: (e) => this._confirmDelete(e),
                },
                'view': {
                    columns: this._getNewMaterialItemColumns(false),
                    toolbar: this._getToolbarOptions(),
                    editing: {
                        allowAdding: false,
                        allowDeleting: false,
                        allowUpdating: false,
                    },
                    selection: {
                        mode: 'none'
                    }
                },
                "approve": {
                    columns: this._getNewMaterialItemColumns(false),
                    toolbar: this._getToolbarOptions(),
                    editing: {
                        allowAdding: false,
                        allowDeleting: false,
                        allowUpdating: false,
                    },
                    selection: {
                        mode: 'none'
                    }
                }
            }
        };

        const appType = this.appMain.applicationType.toLowerCase();
        const mode = this.appMain.mode.toLowerCase();

        if (!configuration[appType] || !configuration[appType][mode]) {
            console.error(`Grid configuration not found for application type: ${appType} and mode: ${mode}`);
            return this._getDefaultConfigurations();
        }
        return configuration[appType][mode];
    }

    _getDefaultConfigurations() {
        return {
            columns: [{ dataField: 'id', caption: 'ID', visible: false }],
            toolbar: this._getViewOnlyToolbarOptions(),
            editing: {
                allowAdding: false,
                allowDeleting: false,
                allowUpdating: false,
            },
            selection: {
                mode: 'none'
            }
        };
    }

    // Columns Definitions
    _getNewMaterialItemColumns(editable = false) {
        const columns = [
            { dataField: 'id', caption: 'ID', visible: false },
            { dataField: 'item.id', caption: 'Item ID', visible: false },
            {
                dataField: 'no',
                caption: 'No.',
                allowEditing: false,
                alignment: 'center',
                width: 50,
                cellTemplate: (container, options) => {
                    const pageIndex = options.component.pageIndex();
                    const pageSize = options.component.pageSize();
                    const rowNumber = (pageIndex * pageSize) + options.rowIndex + 1;

                    $('<div>').html(`${rowNumber}`).appendTo(container);
                }
            },
            {
                dataField: 'categoryId',
                caption: 'Category',
                allowEditing: false,
                lookup: {
                    dataSource: this.lookupData.categories,
                    valueExpr: 'id',
                    displayExpr: 'displayName'
                },
            },
            {
                dataField: 'materialTypeId',
                caption: 'Material Type',
                allowEditing: false,
                lookup: {
                    dataSource: this.lookupData.materialTypes,
                    displayExpr: 'displayName',
                    valueExpr: 'id'
                }
            },
            {
                caption: 'Description',
                cellTemplate: (container, options) => {
                    $('<div>').html(`
                        <div style="padding: 4px 0; border-bottom: 1px solid #e0e0e0;">${options.data.materialDescription || '-'} </div>
                        <div style="padding: 4px 0; color: #666;">${options.data.item?.itemDescription || '-'}</div>
                    `).appendTo(container);
                }
            },
            {                
                dataField: 'materialDescription',
                visible: false
            },
            {
                dataField: 'item.itemDescription',
                visible: false
            },
            {
                caption: 'Unit',
                cellTemplate: (container, options) => {
                    $('<div>').html(`
                        <div style="padding: 4px 0; border-bottom: 1px solid #e0e0e0;">${options.data.materialUnit || '-'}</div>
                        <div style="padding: 4px 0; color: #666;">${options.data.item?.itemUnit || '-'}</div>
                    `).appendTo(container);
                }
            },
            {
                dataField: 'materialUnit',
                visible: false
            },
            {
                dataField: 'item.itemUnit',
                visible: false
            },
            {
                caption: 'Price',
                cellTemplate: (container, options) => {
                    const formatPrice = (price) => {
                        return price != null ? price.toLocaleString('en-US', { 
                            minimumFractionDigits: 4, 
                            maximumFractionDigits: 4 
                        }) : '-';
                    };
                    
                    $('<div>').html(`
                        <div style="padding: 4px 0; border-bottom: 1px solid #e0e0e0;">
                            ${formatPrice(options.data.materialUnitPrice)} THB
                        </div>
                        <div style="padding: 4px 0; color: #666;">
                            ${formatPrice(options.data.item?.itemUnitPrice)} ${options.data.item?.currency || ''}
                        </div>
                    `).appendTo(container);
                }
            },

            {
                dataField: 'materialUnitPrice',
                visible: false
            },
            {
                dataField: 'item.itemPrice',
                visible: false
            },
            {
                dataField: 'minimumOrder',
                caption: 'Safety stock',
            },
            {
                dataField: 'costCenter',
                caption: 'Cost Center',
                allowEditing: false,
            },
            {
                dataField: 'item.conversionRate',
                caption: 'Conversion Rate',
                allowEditing: false,
            },
            {
                dataField: 'item.moq',
                caption: 'MOQ',
                allowEditing: false,
            },
            {
                dataField: 'item.lotSize',
                caption: 'Lot Size',
                allowEditing: false,
            },
            {
                dataField: 'item.currency',
                caption: 'Currency',
                allowEditing: false,
                visible: false
            },
            {
                dataField: 'item.leadTime',
                caption: 'Lead Time',
                allowEditing: false,
            },
            {
                dataField: 'item.quotationExpiryDate',
                caption: 'Quotation Expiry Date',
                dataType: 'date',
                format: this.appMain.getDateFormat(),
                allowEditing: false,
            },
            {
                dataField: 'item.groupOfGoods',
                caption: 'Group of Goods',
                allowEditing: false,
                lookup: {
                    dataSource: this.lookupData.groupOfGoods,
                    displayExpr: 'displayName',
                    valueExpr: 'id'
                }
            }
        ];

        if (editable) {
            columns.push({
                type: 'buttons',
                fixed: true,
                fixedPosition: 'right',
                width: 70,
                buttons: [
                    {
                        hint: 'Delete',
                        icon: 'trash',
                        cssClass: 'text-danger',
                        onClick: async (e) => {
                            if(this._isDeleting) return;
                            this._isDeleting = true;

                            try{
                                const confirmed = await this.appMain.dialog.confirm({
                                    title: 'Confirm Delete',
                                    message: 'Are you sure you want to remove this item?',
                                    type: 'warning'
                                });

                                if (confirmed) {
                                    const rowIndex = e.row.rowIndex;
                                    e.component.deleteRow(rowIndex);
                                    this.appMain.notification.success('Item deleted successfully');
                                }
                            }finally{
                                setTimeout(() => {
                                    this._isDeleting = false;
                                }, 100);
                            }
                        }
                    }
                ]
            });
        }

        return columns;
    }

    // Toolbar Options
    _getToolbarOptions() {
        return {
            items: [
                {
                    location: 'before',
                    template: () => {
                        if (this.appMain.mode === 'view' || this.appMain.mode === 'approve') {
                            return $('<span/>'); 
                        }

                        return $('<button/>')
                            .addClass('dialog-btn dialog-danger dialog-btn-ok')
                            .html('<i class="fas fa-trash"></i> Delete Selected')
                            .on('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                $(e.currentTarget).blur();
                                this._deleteSelected();
                            });
                    }
                },
                {
                    location: 'after',
                    template: () => {
                        return $('<button/>')
                            .addClass('dialog-btn dialog-btn-cancel')
                            .html('<i class="fas fa-sync-alt"></i> Refresh')
                            .attr('title', 'Refresh')
                            .on('click', (e) => {
                                e.preventDefault();
                                $(e.currentTarget).blur();
                                this.refresh();
                            });
                    }
                },
                {
                    location: 'after',
                    template: () => {
                        return $('<button/>')
                            .addClass('dialog-btn dialog-btn-cancel')
                            .html('<i class="fas fa-file-excel"></i> Export Excel')
                            .on('click', (e) => {
                                e.preventDefault();
                                $(e.currentTarget).blur();
                                this._exportToExcel();
                            });
                    }
                },
                'searchPanel',
            ]
        };
    }

    _getViewOnlyToolbarOptions() {
        return {
            items: [
                {
                    location: 'after',
                    widget: 'dxButton',
                    options: {
                        icon: 'refresh',
                        hint: 'Refresh',
                        onClick: () => this.refresh()
                    }
                },
                {
                    location: 'after',
                    widget: 'dxButton',
                    options: {
                        icon: 'exportxlsx',
                        text: 'Export Excel',
                        onClick: () => this._exportToExcel()
                    }
                },
                'searchPanel',
            ]
        };
    }

    _initializeGrid() {
        const config = this._getGridConfigurations();

        const baseConfig = {
            dataSource: this.data ? this.data.materials : [],
            showBorders: true,
            showRowLines: true,
            showColumnLines: true,
            allowColumnReordering: true,
            columnAutoWidth: true,
            showBorders: true,
            columnFixing: {
                enabled: true
            },
            hoverStateEnabled: true,
            paging: {
                pageSize: 10
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [10, 25, 50, 100],
                showInfo: true
            },
            searchPanel: {
                visible: true,
                width: 240,
                placeholder: 'Search...'
            },
            headerFilter: {
                visible: true
            },
            filterRow: {
                visible: false
            },
            noDataText: 'No items added yet. Click "Add Item" to begin.',
            ...config
        };
        this.gridInstance = $(this.container).dxDataGrid(baseConfig).dxDataGrid('instance');
    }

    // Event Handlers
    async _confirmDelete(e) {
        e.cancel = true;
        const confirmed = await this.appMain.dialog.confirm({
            title: 'Confirm Delete',
            message: 'Are you sure you want to remove this item?',
            type: 'warning'
        });

        if (confirmed) {
            const rowIndex = e.component.getRowIndexByKey(e.key);
            e.component.deleteRow(rowIndex);
        }
    }

    async _deleteSelected() {
        if (!this.gridInstance) return;

        if (this._isDeletingSelected) return;

        const selectedRows = this.gridInstance.getSelectedRowsData();

        if (selectedRows.length === 0) {
            this.appMain.notification.warning('Please select at least one item to delete');
            return;
        }

        this._isDeletingSelected = true;

        try{
            const confirmed = await this.appMain.dialog.confirm({
                title: 'Confirm Delete',
                message: `Are you sure you want to delete ${selectedRows.length} selected item(s)?`,
                type: 'warning'
            });

            if (!confirmed) return;

            // Get current data source
            const currentData = this.get() || [];

            // Get IDs of selected rows
            const selectedIds = selectedRows.map(row => row.id);

            // Filter out selected items
            const newData = currentData.filter(item => !selectedIds.includes(item.id));

            // Update grid
            this.set(newData);

            // Clear selection
            this.gridInstance.clearSelection();

            this.appMain.notification.success(`Successfully deleted ${selectedRows.length} item(s)`);

        }catch (error) {
            console.error('Error deleting selected items:', error);
            this.appMain.notification.error('Failed to delete selected items');
        } finally {
            setTimeout(() => {
                this._isDeletingSelected = false;
            }, 100);
        }
    }

    _exportToExcel() {
        // Implementation for Excel export
        this.appMain.notification.info('Exporting to Excel...');
    }

    // Public Methods
    async render() {
        await this._loadLookupData();

        const gridContainer = document.createElement('div');
        gridContainer.className = 'application-grid-container';
        gridContainer.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <span class="header-application-type">
                        ${this.appMain.getApplicationTypeDisplayName()} Items
                    </span>
                    <div id="gridInstanceContainer" class="mt-3"></div>
                </div>
            </div>
        `;
        this.container.append(gridContainer);
        this.container = gridContainer.querySelector('#gridInstanceContainer');

        this._initializeGrid();
    }

    async _loadLookupData() {
        let [categories, materialTypes, groupOfGoods] = await Promise.all([
            this.appMain.formComponents.getCategoryDataSource(),
            this.appMain.formComponents.getMaterialTypeDataSource(),
            this.appMain.formComponents.getGroupOfGoodsDataSource()
        ]);

        this.lookupData = {
            categories,
            materialTypes,
            groupOfGoods
        };
    }

    update(data) {
        this.data = data;
        if (this.gridInstance) {
            this.set(data ? data.items : []);
        }
    }

    addItem(item) {
        if (this.gridInstance) {
            const dataSource = this.get() || [];
            dataSource.push(item);
            this.set(dataSource);
            this.refresh();
        }
    }

    addItems(items) {
        if (this.gridInstance) {
            const dataSource = this.get() || [];
            dataSource.push(...items);
            this.set(dataSource);
            this.refresh();
        }
    }

    updateItem(itemId, updatedData) {
        if (this.gridInstance) {
            const dataSource = this.get() || [];
            const index = dataSource.findIndex(item => item.id === itemId);
            if (index !== -1) {
                dataSource[index] = { ...dataSource[index], ...updatedData };
                this.set(dataSource);
                this.refresh();
            }
        }
    }

    removeItem(itemId) {
        if (this.gridInstance) {
            const dataSource = this.get() || [];
            const filtered = dataSource.filter(item => item.id !== itemId);
            this.set(filtered);
            this.refresh();
        }
    }

    set(data) {
        if (this.gridInstance) {
            this.gridInstance.option('dataSource', data);
        }
    }

    get() {
        if (this.gridInstance) {
            return this.gridInstance.option('dataSource');
        }
    }

    getSelectedItems() {
        return this.gridInstance.getSelectedRowsData();
    }

    clearSelection() {
        this.gridInstance.clearSelection();
    }


    refresh() {
        if (this.gridInstance) {
            this.gridInstance.refresh();
        }
    }

    validate() {
        // Optional: validate grid data if needed
        const items = this.get();
        if (!items || items.length === 0) {
            return {
                isValid: false,
                message: 'At least one item is required in the items list.'
            };
        }
        return {
            isValid: true
        };
    }
}