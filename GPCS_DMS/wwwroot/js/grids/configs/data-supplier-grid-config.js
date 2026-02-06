const DataSupplierGridConfig = {
    gridId: 'gridDataSupplierGrid',
    container: '#gridDataSupplier',
    endpoint: window.APP_CONFIG.baseUrl + 'dxGridSuppliers',
    keyField: 'id',
    exportFileName: 'Data_Supplier',
    columns: [
        GridHelper.createNumberColumn('id', 'ID', '#,##0', {
            width: 80,
            allowEditing: false,
            fixed: true,
            visible: false,
            formItem: { visible: false },
        }),
        GridHelper.createColumn('code', 'Supplier Code', {
            width: 150,
            fixed: true,
            allowFiltering: true,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createColumn('name', 'Supplier Name', {
            minWidth: 250,
            allowFiltering: true,
            validationRules: [{ type: 'required' }]
        }),

        // Lookup Column (Display Only)
        GridHelper.createColumn(null, 'Display Name', {
            width: 350,
            allowEditing: false,
            formItem: { visible: false },
            calculateDisplayValue: (rowData) => {
                return rowData.name && rowData.code
                    ? `${rowData.code} : ${rowData.name}`
                    : '-';
            }
        }),

        GridHelper.createBooleanColumn('isActive', 'Active', {
            width: 100
        }),

        // Purchaser Information
        GridHelper.createNumberColumn('supplierPurchasersCount', 'Purchasers', '#,##0', {
            width: 110,
            caption: 'No. of Purchasers',
            allowEditing: false,
            formItem: { visible: false },
        }),
        // Purchaser Names with Tooltip
        {
            dataField: 'purchaserNames',
            width: 250,
            allowEditing: false,
            allowFiltering: false,
            allowSorting: false,
            allowReordering: false,
            allowGrouping: false,
            allowHeaderFiltering: false,
            formItem: { visible: false },
            calculateDisplayValue: (rowData) => {
                if (rowData.purchaserNames){
                    return rowData.purchaserNames;
                }
            },
        },
        // Audit Trail
        ...GridFactory.getAuditColumns()
    ]
};

window.DataSupplierGridConfig = DataSupplierGridConfig;