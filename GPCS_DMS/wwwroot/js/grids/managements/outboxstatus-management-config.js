async function createOutBoxEventsManagementGridConfig() {
    let statuses = [];
    try {
        const response = await Http.getCache('outBoxStatus/lookups/', 10 * 60 * 1000);
        if (response && response.success) {
            statuses = response.data || [];
        }
    } catch (error) {
        console.error('Failed to load Outbox Status lookup:', error);
    }

    const outBoxStatusDataSource = new DevExpress.data.ArrayStore({
        key: 'id',
        data: statuses
    });

    return {
    gridId: 'outBoxEventsManagementGrid',
    container: '#gridOutBoxEventsManagement',
    endpoint: `${window.APP_CONFIG.baseUrl}dxGridOutBoxEvents`,
    keyField: 'id',
    exportFileName: 'OutBoxEvents_Management',
    columns:[
         GridHelper.createNumberColumn('id', 'ID', '#,##0', {
            width: 80,
            allowEditing: false,
            fixed: true,
            visible: false,
            formItem: { visible: false },
        }),

        GridHelper.createColumn('eventType', 'Event Type', {
            width: 200,
            allowEditing: false,
            fixed: true,
        }),

        GridHelper.createColumn('payload', 'Payload', {
            maxWidth: 400,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createLookupColumn('status', 'Status', outBoxStatusDataSource,'displayName','id', {
            width: 150,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createNumberColumn('retryCount', 'Retry Count', '#,##0', {
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createNumberColumn('maxRetryCount', 'Max Retry Count', '#,##0', {
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createColumn('errorMessage', 'Error Message', {
            allowEditing: false,
            fixed: false,
        }),

        ...GridFactory.getAuditColumns()
    ]
    };
}

window.createOutBoxEventsManagementGridConfig = createOutBoxEventsManagementGridConfig;
    