const ApplicationHistoryReportGridConfig = {
    gridId: 'applicationHistoryReportGrid',
    container: '#gridApplicationHistoryReport',
    endpoint: `${window.APP_CONFIG.baseUrl}dxGridApplicationHistories`,
    keyField: 'id',
    exportFileName: 'Application_History_Report',
    columns: 
    [
        GridHelper.createNumberColumn('applicationId', 'Application ID', '#,##0', {
            width: 150,
            allowEditing: false,
            fixed: false,
            visible: false,
        }),

        GridHelper.createColumn('applicationNumber', 'Application Number', {
            minWidth: 180,
            allowEditing: false,
            fixed: true,
        }),

        GridHelper.createNumberColumn('id', 'ID', '#,##0', {
            width: 80,
            allowEditing: false,
            fixed: true,
            visible: false,
            formItem: { visible: false },
        }),

        GridHelper.createColumn('stepName', 'Step Name', {
            minWidth: 200,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createNumberColumn('stepSequenceNo', 'Step Sequence No', '#,##0', {
            width: 150,
            allowEditing: false,
            fixed: false,
            visible: false,
        }),

        GridHelper.createColumn('nId', 'NID', {
            minWidth: 150,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createColumn('fullName', 'Full Name', {
            minWidth: 250,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createColumn('actionType', 'Action Type', {
            width: 150,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createColumn('comments', 'Comments', {
            minWidth: 300,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createColumn('createdAt', 'Created At', {
            width: 180,
            allowEditing: false,
            fixed: false,
            dataType: 'dateTime',
            format: 'dd/MM/yyyy HH:mm',
        }),
    ]
};

window.ApplicationHistoryReportGridConfig = ApplicationHistoryReportGridConfig;