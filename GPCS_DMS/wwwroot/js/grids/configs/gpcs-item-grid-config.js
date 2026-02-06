const ItemGridConfig = {
    gridId: 'gpcsItemGrid',
    container: '#gridGPCSItem',
    endpoint: window.APP_CONFIG.gpcsUrl + 'dxGridAdTmItems',
    keyField: 'itemCode',
    exportFileName: 'GPCS_Items',

    columns: [
        GridHelper.createColumn('materialCode', 'Material Code', {
            fixed: true,
            allowEditing: false,
            width: 150
        }),
        GridHelper.createColumn('itemCode', 'Item Code', {
            allowEditing: false,
            width: 220
        }),
        GridHelper.createColumn('itemDesc', 'Item Description', {
            minWidth: 250,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createColumn('unit', 'Unit', {
            width: 80,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createNumberColumn('unitPrice', 'Unit Price', '#,##0.00', {
            width: 130,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createColumn('currencyCode', 'Currency', {
            width: 100,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createNumberColumn('moq', 'MOQ', '#,##0.00', {
            width: 100,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createNumberColumn('lotSize', 'Lot Size', '#,##0.00', {
            width: 100
        }),
        GridHelper.createNumberColumn('leadDay', 'Lead Time (Days)', '#,##0.00', {
            width: 130
        }),
        GridHelper.createColumn('supplCode', 'Supplier Code', {
            width: 130,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createNumberColumn('conversionRate', 'Conv. Rate', '#,##0.0000', {
            width: 120
        }),
        GridHelper.createBooleanColumn('ponecFlag', 'PO NEC Flag', {
            width: 120,
            visible: false
        }),
        GridHelper.createDateColumn('quoExpire', 'Quotation Expire', 'dd/MM/yyyy', {
            width: 150
        }),
        ...GridFactory.getGPCSAuditColumns()
    ]
};

window.ItemGridConfig = ItemGridConfig;
