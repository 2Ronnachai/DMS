async function createPurchaserManagementGridConfig() {
    let accounts = [];
    try {
        const response = await Http.getCache('accounts/lookups/', 10 * 60 * 1000);
        if (response && response.success) {
            accounts = response.data || [];
        }
    } catch (error) {
        console.error('Failed to load Accounts lookup:', error);
    }

    const accountDataSource = new DevExpress.data.ArrayStore({
        key: 'id',
        data: accounts
    });

    return {
    gridId: 'purchaserManagementGrid',
    container: '#gridPurchaserManagement',
    endpoint: `${window.APP_CONFIG.baseUrl}dxGridPurchasers`,
    keyField: 'id',
    exportFileName: 'Purchaser_Management',
    enableEditing: false,
    editing: {
        mode: 'popup',
        allowAdding: true,
        allowUpdating: true,
        allowDeleting: true,
        confirmDelete: false,
        useIcons: true,
        popup: {
            title: 'Purchaser Information',
            showTitle: true,
            width: '40vw',
            height: 'auto',
        },
        form: {
            colCount: 2,
            labelLocation: 'top',
            validationGroup: 'purchaserManagementValidationGroup',
            items: [
                {
                    dataField: 'accountId',
                    label: { text: 'Account' },
                    colSpan: 2,
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        stylingMode: 'filled',
                        dataSource: accountDataSource,
                        displayExpr: 'displayName',
                        valueExpr: 'id',
                        searchEnabled: true,
                        showClearButton: true,
                        paginate: true,
                        pageSize: 10,
                        noDataText: 'No accounts found',
                        placeholder: 'Select an Account',
                    },
                    validationRules: [{ type: 'required' }],
                },
                {
                    dataField: 'userName',
                    label: { text: 'User Name' },
                    colSpan: 2,
                    editorOptions: {
                        stylingMode: 'filled',
                    },
                },

            ]
        }
    },
    columns: [
        GridHelper.createNumberColumn('id', 'ID', '#,##0', {
            width: 80,
            allowEditing: false,
            fixed: true,
            visible: false,
            formItem: { visible: false },
        }),
        GridHelper.createColumn('accountId', 'Account',{
            width: 300,
            visible: false,
            validationRules: [{ type: 'required' }],
        }),

        GridHelper.createColumn('userName', 'User Name', {
            minWidth: 150,
            validationRules: [
                { type: 'required' },
                {
                    type: 'custom',
                    validationCallback: function (e) {
                        return /^[A-Za-z0-9._%+-]+$/.test(e.value || '');
                    },
                    message: 'User Name can only contain letters, numbers, and . _ % + -'
                }
            ],
        }),

        // nId , Full Name , Email , isAccountActive from Account DTO => Display Only
        GridHelper.createColumn('nId', 'NId', {
            width: 150,
            allowEditing: false,
            formItem: { visible: false },
        }),
        GridHelper.createColumn('fullName', 'Full Name', {
            minWidth: 200,
            allowEditing: false,
            formItem: { visible: false },
        }),
        GridHelper.createColumn('email', 'Email', {
            minWidth: 200,
            allowEditing: false,
            formItem: { visible: false },
        }),
        GridHelper.createColumn('isAccountActive', 'Account Active', {
            width: 150,
            allowEditing: false,
            formItem: { visible: false },
        }),

        ...GridFactory.getAuditColumns()
    ],
    onEditorPreparing: (e) => {
        if (e.dataField === 'accountId' && e.parentType === 'dataRow') {
            if (!e.row.isNewRow) {
                e.editorOptions.readOnly = true;
                e.editorOptions.stylingMode = 'outlined';
            }
        }
    },
    enableConfirmDelete: true,
    deleteConfirmOptions: {
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this purchaser?',
        type: 'warning',
        okText: 'Delete',
        cancelText: 'Cancel',
    },
    };
}

window.createPurchaserManagementGridConfig = createPurchaserManagementGridConfig;