const SupplierManagementGridConfig = Object.assign({}, DataSupplierGridConfig);
SupplierManagementGridConfig.gridId = 'supplierManagementGrid';
SupplierManagementGridConfig.container = '#gridSupplierManagement';
SupplierManagementGridConfig.endpoint = `${window.APP_CONFIG.baseUrl}dxGridSuppliers`;
SupplierManagementGridConfig.keyField = 'id';
SupplierManagementGridConfig.exportFileName = 'Supplier_Management';

SupplierManagementGridConfig.enableEditing = false;
SupplierManagementGridConfig.editing = {
    mode: 'popup',
    allowAdding: true,
    allowUpdating: true,
    allowDeleting: true,
    confirmDelete: false,
    useIcons: true,
    popup: {
        title: 'Supplier Information',
        showTitle: true,
        width: '60vw',
        height: 'auto',
    },
    form: {
        colCount: 4,
        labelLocation: 'top',
        items: [
            {
                dataField: 'code',
                label: { text: 'Code' },
                colSpan: 1,
                editorOptions:{
                    stylingMode: 'filled',
                },
                validationRules: [{ type: 'required' }],
            },
            {
                dataField: 'name',
                label: { text: 'Name' },
                colSpan: 3,
                editorOptions:{
                    stylingMode: 'filled',
                },
                validationRules: [{ type: 'required' }],
            },
            {
                dataField: 'isActive',
                label: { text: 'Active' },
                colSpan: 1,
                editorOptions:{
                    stylingMode: 'filled',
                },
            }
        ]
    }
};
// Add When Adding New Supplier, Set isActive to True by Default
SupplierManagementGridConfig.onInitNewRow = (e) => {
    console.log('Initializing new row for Supplier Management Grid');
    e.data.isActive = true;
};

// Use shared confirm-delete logic from BaseGrid
SupplierManagementGridConfig.enableConfirmDelete = true;
SupplierManagementGridConfig.deleteConfirmOptions = {
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this supplier?',
    type: 'warning',
    okText: 'Delete',
    cancelText: 'Cancel'
};

window.SupplierManagementGridConfig = SupplierManagementGridConfig;