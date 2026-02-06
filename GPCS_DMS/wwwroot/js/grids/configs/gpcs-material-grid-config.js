const MaterialGridConfig = {
    gridId: 'gpcsMaterialGrid',
    container: '#gridGPCSMaterial',
    endpoint: window.APP_CONFIG.gpcsUrl + 'dxGridAdTmMaterials',
    keyField: 'materialCode',
    exportFileName: 'GPCS_Materials',
    
    columns: [
        GridHelper.createColumn('materialCode', 'Material Code', {
            fixed: true,
            allowEditing: false,
            width: 150
        }),
        GridHelper.createColumn('materialDesc', 'Material Description', {
            minWidth: 300,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createColumn('cat1Code', 'Category 1', {
            width: 100
        }),
        GridHelper.createColumn('cat2Code', 'Category 2', {
            width: 100
        }),
        GridHelper.createBooleanColumn('stockCtrlFlag', 'Stock Control', {
            width: 120
        }),
        GridHelper.createColumn('unit', 'Unit', {
            width: 80,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createNumberColumn('unitPrice', 'Unit Price', '#,##0.00 ฿', {
            width: 120,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createNumberColumn('minimumQty', 'Min Qty', '#,##0.00', {
            width: 100
        }),
        GridHelper.createNumberColumn('priceToSub', 'Price to Sub', '#,##0.00', {
            width: 120,
            allowEditing: true
        }),
        GridHelper.createColumn('controlDept', 'Control Dept', {
            width: 130
        }),
        GridHelper.createColumn('accountCode', 'Account Code', {
            width: 130
        }),
        ...GridFactory.getGPCSAuditColumns()
    ]
};

window.MaterialGridConfig = MaterialGridConfig;
