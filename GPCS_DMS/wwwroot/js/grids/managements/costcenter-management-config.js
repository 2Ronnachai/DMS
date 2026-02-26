async function createCostCenterManagementGridConfig() {
    const ttlMs = 10 * 60 * 1000;

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

    const [purchasers, costCenters] = await Promise.all([
        loadLookup('purchasers/lookups/', 'Purchasers'),
        loadLookup('purchaserCostCenter/lookups/', 'Cost Centers')
    ]);

    const purchaserDataSource = new DevExpress.data.ArrayStore({
        key: 'id',
        data: purchasers
    });

    const costCenterDataSource = new DevExpress.data.ArrayStore({
        key: 'id',
        data: costCenters
    });

    return {
    gridId: 'costCenterManagementGrid',
    container: '#gridCostCenterManagement',
    endpoint: `${window.APP_CONFIG.baseUrl}dxGridPurchaserCostCenter`,
    keyField: 'id',
    exportFileName: 'Purchaser_Cost_Center_Management',
    // Close defualt editing and Added Customize Editing Settings
    enableEditing: false,
    editing: {
        mode: 'popup',
        allowAdding: true,
        allowUpdating: false,
        allowDeleting: true,
        confirmDelete: false,
        useIcons: true,
        popup: {
            title: 'Cost Center Information',
            showTitle: true,
            width: '40vw',
            height: 'auto',
        },
        form:{
            colCount: 1,
            labelLocation: 'top',
            items:[
                {
                    dataField: 'purchaserId',
                    label: { text: 'Purchaser' },
                    editorType: 'dxSelectBox',
                    editorOptions:{
                        stylingMode: 'filled',
                        dataSource: purchaserDataSource,
                        displayExpr: 'displayName',
                        valueExpr: 'id',
                        searchEnabled: true,
                        showClearButton: true,
                        paginate: true,
                        pageSize: 10,
                        noDataText: 'No purchasers found',
                        placeholder: 'Select a Purchaser',
                    },
                    validationRules: [{ type: 'required' }],
                },
                {
                    dataField: 'organizationUnitId',
                    label: { text: 'Cost Center' },
                    editorType: 'dxSelectBox',
                    editorOptions:{
                        stylingMode: 'filled',
                        dataSource: costCenterDataSource,
                        displayExpr: 'displayName',
                        valueExpr: 'id',
                        searchEnabled: true,
                        showClearButton: true,
                        paginate: true,
                        pageSize: 10,
                        noDataText: 'No cost centers found',
                        placeholder: 'Select a Cost Center',
                    },
                    validationRules: [{ type: 'required' }],
                }
            ]
        }
    },
    columns:[
        GridHelper.createNumberColumn('id', 'ID', '#,##0', {
            width: 80,
            allowEditing: false,
            fixed: true,
            visible: false,
            formItem: { visible: false },
        }),
        GridHelper.createColumn('purchaserId', 'Purchaser ID', {
            width: 150,
            visible: false,
            validationRules: [{ type: 'required' }],
        }),
        GridHelper.createColumn('purchaserName', 'Purchaser Name',{
            minWidth: 250,
            visible: true,
            formItem: { visible: false },
        }),
        GridHelper.createColumn('organizationUnitId', 'CostCenterId',{
            width: 200,
            visible: false,
            validationRules: [{ type: 'required' }],
            setCellValue: async function (newData, value) {
                newData.organizationUnitId = value;
                console.log('Selected Cost Center ID:', value);

                const costCenter = await costCenterDataSource.byKey(value);
                if (costCenter) {
                    newData.organizationUnitName = costCenter.displayName;
                }else{
                    newData.organizationUnitName = null;
                }
            }
        }),
        GridHelper.createColumn('organizationUnitName', 'Cost Center',{
            minWidth: 250,
            visible: true,
            formItem: { visible: false },
        }),
    ],
    enableConfirmDelete: true,
    deleteConfirmOptions: {
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this Cost Center?',
        okText: 'Yes',
        cancelText: 'No',
    },
    };
}

window.createCostCenterManagementGridConfig = createCostCenterManagementGridConfig;