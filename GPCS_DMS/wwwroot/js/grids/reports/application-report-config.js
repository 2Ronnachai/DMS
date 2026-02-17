const ApplicationReportGridConfig = {
    gridId: 'applicationReportGrid',
    container: '#gridApplicationReport',
    endpoint: `${window.APP_CONFIG.baseUrl}dxGridApplications`,
    keyField: 'id',
    exportFileName: 'Application_Report',
    columns: [
        GridHelper.createNumberColumn('id', 'ID', '#,##0', {
            width: 80,
            allowEditing: false,
            fixed: true,
            visible: false,
            formItem: { visible: false },
        }),

        {
            dataField: 'isUrgent',
            caption: 'Urgent',
            width: 80,
            dataType: 'boolean',
            visible: false,
        },

        GridHelper.createColumn('applicationNumber', 'Application Number', {
            minWidth: 180,
            allowEditing: false,
            fixed: true,
            cellTemplate: (container, options) => {
                const div = document.createElement('div');
                div.className = 'application-number';
                if (options.data.isUrgent) {
                    const urgentIcon = document.createElement('i');
                    urgentIcon.className = 'fas fa-exclamation-circle';
                    urgentIcon.style.color = '#fa8c16';
                    urgentIcon.style.marginRight = '6px';
                    urgentIcon.title = 'Urgent';
                    div.appendChild(urgentIcon);
                }

                const text = document.createTextNode(options.value);
                div.appendChild(text);

                $(container).append(div);
            }
        }),

        GridHelper.createColumn('applicationType', 'Application Type', {
            minWidth: 200,
            allowEditing: false,
            fixed: false,
            visible: true,
            cellTemplate: function (container, options) {
                const displayText = options.data.applicationTypeForDisplay || options.value;
                $(container).text(displayText);
            },
        }),

        // GridHelper.createColumn('applicationTypeForDisplay', 'Application Type', {
        //     minWidth: 200,
        //     allowEditing: false,
        //     fixed: false,
        //     allowSorting: false,
        //     allowFiltering: false,
        //     allowSearch: false
        // }),

        GridHelper.createColumn('applicationStatus', 'Application Status', {
            width: 120,
            allowEditing: false,
            fixed: false,
        }),

        // GridHelper.createColumn('supplier', 'Supplier', {
        //     minWidth: 250,
        //     allowEditing: false,
        //     fixed: false,
        //     allowSorting: false,
        //     allowFiltering: false,
        //     allowSearch: false
        // }),

        GridHelper.createNumberColumn('currentWorkflowStep', 'Step', '#,##0', {
            width: 80,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createNumberColumn('workflowRouteId', 'Workflow Route ID', '#,##0', {
            width: 150,
            allowEditing: false,
            fixed: false,
            visible: false,
        }),

        {
            dataField: 'supplierCode',
            visible: false,
        },
        {
            dataField: 'supplierName',
            caption: 'Supplier',
            minWidth: 250,
            allowEditing: false,
            fixed: false,
            visible: true,
            cellTemplate: function (container, options) {
                const displayText = (options.data.supplierName || '') + ' : ' + options.data.supplierCode;
                $(container).text(displayText);
            }
        },

        GridHelper.createColumn('department', 'Department', {
            width: 200,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createColumn('requestor', 'Requestor', {
            width: 200,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createColumn('effectiveDate', 'Effective Date', {
            width: 150,
            dataType: 'date',
            format: 'dd/MM/yyyy',
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createColumn('remark', 'Remark', {
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createColumn('completedAt', 'Completed At', {
            width: 150,
            dataType: 'date',
            format: 'dd/MM/yyyy',
            allowEditing: false,
            fixed: false,
        }),


        {
            type: 'buttons',
            buttons: [
                {
                    hint: 'View Details',
                    icon: 'info',
                    onClick: function (e) {
                        e.event.stopPropagation();

                        const id = e.row.data.id;
                        // Open popup simple workflow
                        console.log('Viewing details for Application ID:', id);
                    },
                },
                {
                    hint: 'Open Form',
                    icon: 'search',
                    onClick: function (e) {

                        e.event.stopPropagation();

                        const url = `${window.APP_CONFIG?.host}Application/SetApplicationType?applicationType=${e.row.data.applicationType}&id=${e.row.data.id}`;
                        window.open(url, '_blank');
                    }
                }
            ],
        },

        ...GridFactory.getAuditColumns()
    ],
    onRowPrepared: (e) => {
        // if (e.rowType === 'data') {
        //     e.rowElement.css('cursor', 'pointer');
        // }
    },
    onRowClick: (e) => {

    }
};
window.ApplicationReportGridConfig = ApplicationReportGridConfig;