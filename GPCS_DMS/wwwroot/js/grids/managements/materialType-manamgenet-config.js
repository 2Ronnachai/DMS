const MaterialTypeManagementGridConfig = {
    gridId: "materialTypeManagementGrid",
    container: "#gridMaterialTypeManagement",
    endpoint: `${window.APP_CONFIG.baseUrl}dxGridMaterialTypes`,
    keyField: "id",
    exportFileName: "MaterialType_Management",
    columns: [
        // MaterialType DTO
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
                { type: 'stringLength', max: 50, message: 'Code cannot exceed 50 characters' }
            ]
        }),
        GridHelper.createColumn('name', 'Name', {
            minWidth: 300,
            validationRules: [
                { type: 'required', message: 'Name is required' },
                { type: 'stringLength', max: 200, message: 'Name cannot exceed 200 characters' }
            ]
        }),
        GridHelper.createBooleanColumn('isActive', 'Active', {
            width: 100,
        }),
        GridHelper.createNumberColumn('dataMaterialsCount', 'Materials Count', '#,##0', {
            width: 150,
            allowEditing: false,
            allowFiltering: false,
            allowSorting: false,
            allowReordering: false,
            allowGrouping: false,
            allowHeaderFiltering: false,
            formItem: { visible: false },
        }),
        ...GridFactory.getAuditColumns()
    ],
    onInitNewRow: (e) => {
        console.log('Initializing new row for Material Type Management Grid');
        e.data.isActive = true;
        e.data.dataMaterialsCount = 0;
    },

    //Customize Editing Settings
    enableEditing: true,
    editing: {
        mode: 'popup',
        allowAdding: true,
        allowUpdating: true,
        allowDeleting: function (e) {
            if (e.row.data.dataMaterialsCount > 0) {
                return false;
            }
            return e.row.data.isActive === false;
        },
        confirmDelete: false,
        useIcons: true,
        popup: {
            title: 'Material Type Information',
            showTitle: true,
            width: '45vw',
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
                        maxLength: 50,
                    },
                    validationRules: [
                        { type: 'required', message: 'Code is required' },
                        { type: 'stringLength', max: 50, message: 'Code cannot exceed 50 characters' }
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
                    dataField: 'name',
                    label: { text: 'Name' },
                    colSpan: 2,
                    editorOptions: {
                        stylingMode: 'filled',
                        maxLength: 200,
                    },
                    validationRules: [
                        { type: 'required', message: 'Name is required' },
                        { type: 'stringLength', max: 200, message: 'Name cannot exceed 200 characters' }
                    ]
                },
                {
                    dataField: 'dataMaterialsCount',
                    label: { text: 'Materials Count' },
                    colSpan: 2,
                    editorType: 'dxNumberBox',
                    editorOptions: {
                        stylingMode: 'outlined',
                        disabled: true,
                        format: '#,##0',
                    },
                    visible: function (e) {
                        return !e.formData.id ? false : true;
                    }
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
                    // Check Existing Code in Grid Data
                    const existingRow = e.component.getDataSource().items().find(
                        item => item.code.toLowerCase() === args.value.toLowerCase()
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
        message: function (e) {
            if (e.row.data.dataMaterialsCount > 0) {
                return `Cannot delete this material type because it has ${e.row.data.dataMaterialsCount} material(s) associated with it.`;
            }
            return 'Are you sure you want to delete this material type?';
        },
        type: 'warning',
        okText: 'Delete',
        cancelText: 'Cancel'
    },
};

window.MaterialTypeManagementGridConfig = MaterialTypeManagementGridConfig;
