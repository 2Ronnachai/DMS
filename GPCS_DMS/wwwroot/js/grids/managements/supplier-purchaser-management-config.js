async function loadSupplierPurchaserLookups(ttlMs = 10 * 60 * 1000) {
    const loadLookup = async (endpoint, label) => {
        try {
            const response = await Http.getCache(endpoint, ttlMs);
            if (response && response.success) {
                return response.data || [];
            }
        } catch (error) {
            console.error(`Failed to load ${label} lookup:`, error);
        }
        return [];
    };

    const [suppliers, purchasers] = await Promise.all([
        loadLookup('suppliers/lookups/', 'Suppliers'),
        loadLookup('purchasers/lookups/', 'Purchasers')
    ]);

    return {
        supplierDataSource: new DevExpress.data.ArrayStore({
            key: 'id',
            data: suppliers
        }),
        purchaserDataSource: new DevExpress.data.ArrayStore({
            key: 'id',
            data: purchasers
        })
    };
}

async function createSupplierPurchaserManagementGridConfig() {
    const { supplierDataSource, purchaserDataSource } = await loadSupplierPurchaserLookups();

    return {
    gridId: "supplierPurchaserManagementGrid",
    container: "#gridSupplierPurchaserManagement",
    endpoint: `${window.APP_CONFIG.baseUrl}dxGridSupplierPurchasers`,
    keyField: "id",
    exportFileName: "SupplierPurchaser_Management",
    //Customize Editing Settings
    enableEditing: true,
    editing: {
        mode: 'popup',
        allowAdding: true,
        allowUpdating: false, 
        allowDeleting: true,
        confirmDelete: false,
        useIcons: true,
        popup: {
            title: 'Supplier-Purchaser Assignment',
            showTitle: true,
            width: '45vw',
            height: 'auto',
        },
        form: {
            colCount: 1,
            labelLocation: 'top',
            items: [
                {
                    dataField: 'supplierId',
                    label: { text: 'Supplier' },
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        stylingMode: 'filled',
                        dataSource: supplierDataSource,
                        displayExpr: 'displayName',
                        valueExpr: 'id',
                        searchEnabled: true,
                        searchExpr: ['name', 'code'],
                        showClearButton: true,
                        paginate: true,
                        pageSize: 10,
                        noDataText: 'No suppliers found',
                        placeholder: 'Select a Supplier',
                    },
                    validationRules: [{ type: 'required', message: 'Supplier is required' }],
                },
                {
                    dataField: 'purchaserId',
                    label: { text: 'Purchaser' },
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        stylingMode: 'filled',
                        dataSource: purchaserDataSource,
                        displayExpr: 'displayName',
                        valueExpr: 'id',
                        searchEnabled: true,
                        searchExpr: ['name', 'code'],
                        showClearButton: true,
                        paginate: true,
                        pageSize: 10,
                        noDataText: 'No purchasers found',
                        placeholder: 'Select a Purchaser',
                    },
                    validationRules: [{ type: 'required', message: 'Purchaser is required' }],
                }
            ]
        }
    },
    onEditorPreparing: function (e) {
        // Validate duplicate combination when adding new row
        if ((e.dataField === 'supplierId' || e.dataField === 'purchaserId') && 
            e.parentType === 'dataRow' && 
            e.row.isNewRow) {
            
            const originalOnValueChanged = e.editorOptions.onValueChanged;
            
            e.editorOptions.onValueChanged = function (args) {
                if (originalOnValueChanged) {
                    originalOnValueChanged.call(this, args);
                }

                setTimeout(() => {
                    const currentRow = e.component.option('editing.editRowKey');
                    const editData = e.component.option('editing.changes').find(
                        change => change.type === 'insert'
                    );

                    if (editData && editData.data.supplierId && editData.data.purchaserId) {
                        // Check for duplicate combination
                        const existingRow = e.component.getDataSource().items().find(
                            item => item.supplierId === editData.data.supplierId && 
                                   item.purchaserId === editData.data.purchaserId
                        );

                        if (existingRow) {
                            appNotification.error(
                                'This Supplier-Purchaser combination already exists in the system.',
                                { timeout: 8000 }
                            );
                            
                            // Clear the values
                            e.component.cellValue(e.row.rowIndex, 'supplierId', null);
                            e.component.cellValue(e.row.rowIndex, 'purchaserId', null);
                        }
                    }
                }, 100);
            };
        }
    },
    enableConfirmDelete: true,
    deleteConfirmOptions: {
        title: 'Confirm Delete',
        message: function(e) {
            return `Are you sure you want to remove the assignment between "${e.row.data.supplierName}" and "${e.row.data.purchaserName}"?`;
        },
        type: 'warning',
        okText: 'Delete',
        cancelText: 'Cancel'
    },
    columns: [
        // SupplierPurchaser DTO
        GridHelper.createNumberColumn('id', 'ID', '#,##0', {
            width: 80,
            allowEditing: false,
            fixed: true,
            visible: false,
            formItem: { visible: false },
        }),
        GridHelper.createLookupColumn('supplierId', 'Supplier', supplierDataSource, 'displayName', 'id', {
            minWidth: 250,
            fixed: true,
            fixedPosition: 'left',
            searchEnabled: true,
            searchExpr: ['name', 'code'],
            validationRules: [{ type: 'required', message: 'Supplier is required' }],
        }),
        GridHelper.createLookupColumn('purchaserId', 'Purchaser', purchaserDataSource, 'displayName', 'id', {
            minWidth: 250,
            validationRules: [{ type: 'required', message: 'Purchaser is required' }],
        }),
    ],
    };
}

window.createSupplierPurchaserManagementGridConfig = createSupplierPurchaserManagementGridConfig;