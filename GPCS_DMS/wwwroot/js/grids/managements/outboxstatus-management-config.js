const outBoxStatusDataSource = new DevExpress.data.CustomStore({
    key: 'id',
    load: async () => {
        const config = {
            outBoxStatus: { enabled: true, ttl: 10 * 60 * 1000 },
        };

        try {
            const response = config.outBoxStatus.enabled
                ? await Http.getCache('outBoxStatus/lookups/', config.outBoxStatus.ttl)
                : await Http.get('outBoxStatus/lookups/');
            if (response && response.success) {
                console.log('Loaded Outbox Status data from cache/server:', response.data);
                return response.data || [];
            }
        } catch (error) {
            console.error('Failed to load Outbox Status lookup:', error);
        }
        return [];
    },
    byKey: async (key) => {
        const config = {
            outBoxStatus: { enabled: true, ttl: 10 * 60 * 1000 },
        };
        try {
            const response = config.outBoxStatus.enabled
                ? await Http.getCache('outBoxStatus/lookups/', config.outBoxStatus.ttl)
                : await Http.get('outBoxStatus/lookups/');
            if (response && response.success) {
                const data = response.data || [];
                return data.find(item => item.id === key);
            }
        } catch (error) {
            console.error('Failed to load Outbox Status by key:', error);
        }
        return null;
    }
});

const OutBoxEventsManagementGridConfig = {
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
            width: 300,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createLookupColumn('status', 'Status', outBoxStatusDataSource,'displayName','id', {
            width: 150,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createNumberColumn('retryCount', 'Retry Count', '#,##0', {
            width: 120,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createNumberColumn('maxRetryCount', 'Max Retry Count', '#,##0', {
            width: 150,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createColumn('errorMessage', 'Error Message', {
            width: 300,
            allowEditing: false,
            fixed: false,
        }),

        ...GridFactory.getAuditColumns()
    ]
};

window.OutBoxEventsManagementGridConfig = OutBoxEventsManagementGridConfig;
    