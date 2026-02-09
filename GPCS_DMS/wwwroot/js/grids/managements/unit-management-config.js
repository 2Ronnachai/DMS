const UnitManagementGridConfig = {
    gridId: "unitManagementGrid",
    container: "#gridUnitManagement",
    endpoint: `${window.APP_CONFIG.baseUrl}dxGridUnits`,
    keyField: "id",
    exportFileName: "Unit_Management",
    columns: [
        // Unit DTO
        GridHelper.createNumberColumn('id', 'ID', '#,##0', {
            width: 80,
            allowEditing: false,
            fixed: true,
            visible: false,
            formItem: { visible: false },
        }),
        GridHelper.createColumn('code', 'Code', {
            width: 150,
            fixed: true,
            fixedPosition: 'left',
            validationRules: [
                { type: 'required', message: 'Code is required' },
                { type: 'stringLength', max: 20, message: 'Code cannot exceed 20 characters' }
            ]
        }),
        GridHelper.createColumn('description', 'Description', {
            minWidth: 300,
            validationRules: [
                { type: 'required', message: 'Description is required' },
                { type: 'stringLength', max: 200, message: 'Description cannot exceed 200 characters' }
            ]
        }),
        GridHelper.createBooleanColumn('isActive', 'Active', {
            width: 100,
        }),
        ...GridFactory.getAuditColumns()
    ],
    onInitNewRow: (e) => {
        console.log('Initializing new row for Unit Management Grid');
        e.data.isActive = true;
    },

    //Customize Editing Settings
    enableEditing: true,
    editing: {
        mode: 'popup',
        allowAdding: true,
        allowUpdating: true,
        allowDeleting: function(e) {
            // ลบได้เฉพาะที่ isActive = false
            return e.row.data.isActive === false;
        },
        confirmDelete: false,
        useIcons: true,
        popup: {
            title: 'Unit Information',
            showTitle: true,
            width: '40vw',
            height: 'auto',
        },
        form: {
            colCount: 2,
            labelLocation: 'top',
            items: [
                {
                    dataField: 'code',
                    label: { text: 'Code' },
                    colSpan: 1,
                    editorOptions: {
                        stylingMode: 'filled',
                        maxLength: 20,
                    },
                    validationRules: [
                        { type: 'required', message: 'Code is required' },
                        { type: 'stringLength', max: 20, message: 'Code cannot exceed 20 characters' }
                    ]
                },
                {
                    dataField: 'isActive',
                    label: { text: 'Active' },
                    colSpan: 1,
                    editorType: 'dxCheckBox',
                    editorOptions: {
                        stylingMode: 'filled',
                    }
                },
                {
                    dataField: 'description',
                    label: { text: 'Description' },
                    colSpan: 2,
                    editorOptions: {
                        stylingMode: 'filled',
                        maxLength: 200,
                    },
                    validationRules: [
                        { type: 'required', message: 'Description is required' },
                        { type: 'stringLength', max: 200, message: 'Description cannot exceed 200 characters' }
                    ]
                }
            ]
        }
    },
    onEditorPreparing: function (e) {
        if (e.dataField === 'code' && e.parentType === 'dataRow') {
            if (!e.row.isNewRow) {
                e.editorOptions.disabled = true;
                e.editorOptions.stylingMode = 'outlined';
            }
        }

        if (e.dataField === 'code' && e.parentType === 'dataRow' && e.row.isNewRow) {
            const originalOnValueChanged = e.editorOptions.onValueChanged;
            
            e.editorOptions.onValueChanged = function (args) {
                if (originalOnValueChanged) {
                    originalOnValueChanged.call(this, args);
                }

                if (args.value) {
                    // Convert to uppercase for consistency 
                    const upperValue = args.value.toUpperCase();
                    e.component.cellValue(e.row.rowIndex, 'code', upperValue);

                    // Check Existing Code in Grid Data
                    const existingRow = e.component.getDataSource().items().find(
                        item => item.code.toUpperCase() === upperValue
                    );
                    
                    if (existingRow) {
                        appNotification.error(
                            'The provided Code already exists in the system. Please use a different Code.', 
                            { timeout: 8000 }
                        );
                        e.component.cellValue(e.row.rowIndex, 'code', null);
                    }
                }
            };
        }
    },
    enableConfirmDelete: true,
    deleteConfirmOptions: {
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this unit?',
        type: 'warning',
        okText: 'Delete',
        cancelText: 'Cancel'
    }
};

window.UnitManagementGridConfig = UnitManagementGridConfig;
