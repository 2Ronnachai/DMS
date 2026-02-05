const InventoryGridConfig = {
    gridId: 'gpcsInventoryGrid',
    container: '#gridGPCSInventory',
    endpoint: window.APP_CONFIG.gpcsUrl + 'dxGridIvTmInventories/',
    keyField: 'materialCode',
    exportFileName: 'GPCS_Inventory',

    columns: [
        GridHelper.createColumn('materialCode', 'Material Code', {
            fixed: true,
            allowEditing: false,
            width: 150,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createColumn('period', 'Period', {
            fixed: true,
            allowEditing: false,
            width: 100,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createNumberColumn('bblanceQty', 'Begin Balance Qty', '#,##0.00', {
            width: 150,
            caption: 'B/F Qty'
        }),
        GridHelper.createNumberColumn('bbalanceAmt', 'Begin Balance Amt', '#,##0.00 ฿', {
            width: 150,
            caption: 'B/F Amount'
        }),
        GridHelper.createNumberColumn('stockInqty', 'Stock In Qty', '#,##0.00', {
            width: 130,
            caption: 'In Qty'
        }),
        GridHelper.createNumberColumn('stockInamt', 'Stock In Amt', '#,##0.00 ฿', {
            width: 150,
            caption: 'In Amount'
        }),
        GridHelper.createNumberColumn('stockOutQty', 'Stock Out Qty', '#,##0.00', {
            width: 130,
            caption: 'Out Qty'
        }),
        GridHelper.createNumberColumn('stockOutAmt', 'Stock Out Amt', '#,##0.00 ฿', {
            width: 150,
            caption: 'Out Amount'
        }),
        GridHelper.createNumberColumn('cbalanceQty', 'Closing Balance Qty', '#,##0.00', {
            width: 150,
            caption: 'C/F Qty'
        }),
        GridHelper.createNumberColumn('cbalanceAmt', 'Closing Balance Amt', '#,##0.00 ฿', {
            width: 150,
            caption: 'C/F Amount'
        }),
        GridHelper.createColumn('mcloseFlag', 'Month Close', {
            width: 100,
            alignment: 'center'
        }),
        ...GridFactory.getGPCSAuditColumns()
    ]
};

window.InventoryGridConfig = InventoryGridConfig;