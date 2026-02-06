const DataMaterialGridConfig = {
    gridId: 'gpcsDataMaterialGrid',
    container: '#gridDataMaterial',
    endpoint: window.APP_CONFIG.baseUrl + 'dxGridDataMaterials',
    keyField: 'id',
    exportFileName: 'Data_Material',
    columns: [
        GridHelper.createNumberColumn('id', 'ID', '#,##0', {
            width: 80,
            allowEditing: false,
            fixed: true,
            visible: false
        }),
        GridHelper.createColumn('code', 'Code', {
            width: 150,
            fixed: true,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createColumn('description', 'Description', {
            minWidth: 250,
            validationRules: [{ type: 'required' }]
        }),

        // Category Section
        GridHelper.createColumn('categoryCode', 'Category Code', {
            width: 120,
        }),
        GridHelper.createColumn('categoryName', 'Category Name', {
            width: 180
        }),

        // Material Type Section
        GridHelper.createColumn('materialTypeCode', 'Material Type Code', {
            width: 150
        }),
        GridHelper.createColumn('materialTypeName', 'Material Type Name', {
            width: 180
        }),

        // Unit & Pricing
        GridHelper.createColumn('unit', 'Unit', {
            width: 80,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createNumberColumn('unitPrice', 'Unit Price', '#,##0.00 ฿', {
            width: 130,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createNumberColumn('minimumOrder', 'Min Order', '#,##0', {
            width: 100
        }),

        // Other Properties
        GridHelper.createColumn('costCenter', 'Cost Center', {
            width: 120
        }),
        GridHelper.createBooleanColumn('stockControl', 'Stock Control', {
        }),
        GridHelper.createNumberColumn('runningNumber', 'Running No.', '#,##0', {
            width: 110,
            allowEditing: false,
            visible: false
        }),
        ...GridFactory.getAuditColumns(),
        GridHelper.createNumberColumn('dataItemsCount', 'Items Count', '#,##0', {
            width: 110,
            allowEditing: false,
            fixed: true,
            fixedPosition: 'right'
        }),

    ]
};
window.DataMaterialGridConfig = DataMaterialGridConfig;