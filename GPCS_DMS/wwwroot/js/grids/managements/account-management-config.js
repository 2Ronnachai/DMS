async function AccountManagementService(nId) {
    const loadingId = appLoading.show('Fetching User Info...');
    try {
        const response = await Http.get(`accounts/external-info/${nId}`);
        if (response && response.success) {
            appNotification.info('User Info fetched successfully.');
            return response.data;
        }else{
            appNotification.error('No User Info found for the provided NID.',{timeout: 8000});
            return null;
        }
    } catch (error) {
        appNotification.error('Failed to fetch User Info. Please check the NID and try again.',{timeout: 8000});
        console.error('AccountManagementService Error:', error);
    }finally {
        appLoading.hide(loadingId);
    }
}

const userTypeDataSource = new DevExpress.data.CustomStore({
    key: 'id',
    load: async () => {
        const config = {
            userTypes: { enabled: true, ttl: 10 * 60 * 1000 },
        };

        try {
            const response = config.userTypes.enabled
                ? await Http.getCache('userTypes/lookups/', config.userTypes.ttl)
                : await Http.get('userTypes/lookups/');

            if (response && response.success) {
                console.log('Loaded User Types data from cache/server:', response.data);
                return response.data || [];
            }
        } catch (error) {
            console.error('Failed to load User Types lookup:', error);
        }
        return [];
    },
    byKey: async (key) => {
        const config = {
            userTypes: { enabled: true, ttl: 10 * 60 * 1000 },
        };

        try {
            const response = config.userTypes.enabled
                ? await Http.getCache('userTypes/lookups/', config.userTypes.ttl)
                : await Http.get('userTypes/lookups/');

            if (response && response.success) {
                const data = response.data || [];
                return data.find(item => item.id === key);
            }
        } catch (error) {
            console.error('Failed to load User Type by key:', error);
        }
        return null;
    }
});

const AccountManagementGridConfig = {
    gridId: "accountManagementGrid",
    container: "#gridAccountManagement",
    endpoint: `${window.APP_CONFIG.baseUrl}dxGridAccounts`,
    keyField: "id",
    exportFileName: "Account_Management",
    columns: [
        // Account DTO
        GridHelper.createNumberColumn('id', 'ID', '#,##0', {
            width: 80,
            allowEditing: false,
            fixed: true,
            visible: false,
            formItem: { visible: false },
        }),
        GridHelper.createColumn('nId', 'NID', {
            minWidth: 150,
            fixed: true,
            fixedPosition: 'left',
            validationRules: [
                { type: 'required' },
                { type: 'stringLength', min: 5, max: 5 }
            ]
        }),
        GridHelper.createColumn('fullName', 'Full Name', {
            minWidth: 250,
            formItem: { visible: false },
        }),
        GridHelper.createColumn('firstName', 'First Name', {
            minWidth: 150,
            validationRules: [{ type: 'required' }],
            visible: false,
        }),
        GridHelper.createColumn('lastName', 'Last Name', {
            minWidth: 150,
            validationRules: [{ type: 'required' }],
            visible: false,
        }),
        GridHelper.createLookupColumn('userType', 'User Type', userTypeDataSource, 'displayName', 'id', {
            width: 200,
            validationRules: [{ type: 'required' }],
        }),

        GridHelper.createColumn('email', 'Email', {
            minWidth: 200,
            validationRules: [
                { type: 'required' },
                { type: 'email' }
            ]
        }),
        GridHelper.createBooleanColumn('isActive', 'Active', {

        }),
        ...GridFactory.getAuditColumns()
    ],
    onInitNewRow: (e) => {
        console.log('Initializing new row for Account Management Grid');
        e.data.isActive = true;
    },

    //Customize Editing Settings
    enableEditing: false,
    editing: {
        mode: 'popup',
        allowAdding: true,
        allowUpdating: true,
        allowDeleting: function(e) {
            return e.row.data.isActive === false;
        },
        confirmDelete: false,
        useIcons: true,
        popup: {
            title: 'Account Information',
            showTitle: true,
            width: '50vw',
            height: 'auto',
        },
        form: {
            colCount: 2,
            labelLocation: 'top',
            items: [
                {
                    dataField: 'nId',
                    label: { text: 'NID' },
                    colSpan: 2,
                    editorOptions: {
                        stylingMode: 'filled',
                        disabled: false,
                        maxLength: 5,
                        minLength: 5
                    },
                    validationRules: [
                        { type: 'required' },
                        { type: 'stringLength', min: 5, max: 5 }
                    ]
                },
                {
                    dataField: 'firstName',
                    label: { text: 'First Name' },
                    colSpan: 2,
                    validationRules: [{ type: 'required' }],
                    editorOptions: {
                        stylingMode: 'filled',
                    },
                },
                {
                    dataField: 'lastName',
                    label: { text: 'Last Name' },
                    colSpan: 2,
                    validationRules: [{ type: 'required' }],
                    editorOptions: {
                        stylingMode: 'filled',
                    },
                },
                {
                    dataField: 'email',
                    label: { text: 'Email' },
                    colSpan: 2,
                    validationRules: [
                        { type: 'required' },
                        { type: 'email' }
                    ],
                    editorOptions: {
                        stylingMode: 'filled',
                    },
                },
                {
                    dataField: 'userType',
                    label: { text: 'User Type' },
                    colSpan: 1,
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        stylingMode: 'filled',
                        dataSource: userTypeDataSource,
                        displayExpr: 'displayName',
                        valueExpr: 'id',
                        searchEnabled: true,
                        showClearButton: true,
                    },
                    validationRules: [{ type: 'required' }],
                },
                {
                    dataField: 'isActive',
                    label: { text: 'Active' },
                    colSpan: 1,
                }
            ]
        }
    },
    onEditorPreparing: function (e) {
        if (['firstName', 'lastName', 'email'].includes(e.dataField) && e.parentType === 'dataRow') {
            if (e.row.isNewRow) {
                e.editorOptions.disabled = true;
                e.editorOptions.stylingMode = 'outlined';
            }
        }

        if (e.dataField === 'nId' && e.parentType === 'dataRow') {
            if(!e.row.isNewRow){
                e.editorOptions.disabled = true;
                e.editorOptions.stylingMode = 'outlined';
            }

            e.editorOptions.onValueChanged = function (args) {
                args.value = args.value.toLowerCase();
                if (args.value.length === 5) {
                    // Check Existing NID in Grid Data
                    const existingRow = e.component.getDataSource().items().find(item => item.nId === args.value);
                    if (existingRow) {
                        appNotification.error('The provided NID already exists in the system. Please use a different NID.', { timeout: 8000 });
                        e.component.cellValue(e.row.rowIndex, 'nId', null);
                        e.component.cellValue(e.row.rowIndex, 'firstName', null);
                        e.component.cellValue(e.row.rowIndex, 'lastName', null);
                        e.component.cellValue(e.row.rowIndex, 'email', null);
                        return;
                    }

                    AccountManagementService(args.value).then(userInfo => {
                        if (userInfo) {
                            const grid = e.component;
                            const rowIndex = e.row.rowIndex;

                            grid.cellValue(rowIndex, 'nId', args.value);
                            grid.cellValue(rowIndex, 'firstName', userInfo.firstName);
                            grid.cellValue(rowIndex, 'lastName', userInfo.lastName);
                            grid.cellValue(rowIndex, 'email', userInfo.email);
                        }
                    });
                }
            };
        }
    },
    enableConfirmDelete: true,
    deleteConfirmOptions: {
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this account?',
        type: 'warning',
        okText: 'Delete',
        cancelText: 'Cancel'
    }
};

window.AccountManagementGridConfig = AccountManagementGridConfig;