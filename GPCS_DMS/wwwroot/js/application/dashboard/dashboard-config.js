const DashboardConfig = {
    ROLE_CARD_MAPPING: {
        user: ['draft', 'returned', 'inProcess', 'completed', 'waitingEffective'],
        verifier: ['waitingVerified', 'verified'],
        approver: ['waitingApprove', 'approved'],
        developer: ['draft', 'returned', 'inProcess', 'completed', 'waitingEffective'],
        administrator: ['draft', 'returned', 'inProcess', 'completed', 'waitingEffective']
    },

    // Summary card
    SUMMARY_CARD: [
        // For User Role
        {
            key: 'draft', 
            label: 'Draft',
            hint: 'My Draft Applications',
        },
        {
            key: 'returned',
            label: 'Returned',
            hint: 'Need your action',
        },
        {
            key: 'inProcess', // Combine Verified, Approved
            label: 'In Process',
            hint: 'Currently progressing',
        },
        {
            key: 'completed', // Combine Completed and Cancelled
            label: 'Completed',
            hint: 'Successfully completed',
        },
        // For Verifier Role
        {
            key: 'waitingVerified', // Combied Verified
            label: 'Waiting Verify',
            hint: 'For your verification',
        },
        {
            key: 'verified', // Combine Approved
            label: 'Verified',
            hint: 'Successfully verified',
        },
        // For Approver Role
        {
            key: 'waitingApprove', // Combine Approved
            label: 'Waiting Approve',
            hint: 'For your approval',
        },
        {
            key: 'approved', // Combine Completed
            label: 'Approved',
            hint: 'Successfully approved',
        },

        // For All Roles
        {
            key: 'waitingEffective', // Combine WaitingEffective
            label: 'Waiting Effective',
            hint: 'Pending effectiveness',
        }
    ],

    // Application Status Configurations
    APPLICATION_STATUS: {
        draft: { class: 'draft', label: 'Draft' },
        returned: { class: 'returned', label: 'Returned' },
        verified: { class: 'verified', label: 'Verified' },
        approved: { class: 'approved', label: 'Approved' },
        completed: { class: 'completed', label: 'Completed' },
        cancelled: { class: 'cancelled', label: 'Cancelled' },
        waitingEffective: { class: 'waiting-effective', label: 'Waiting Effective' },
    },

    GRID_COLUMNS: [
        { 
            dataField: 'isUrgent', 
            caption: 'Urgent', 
            width: 80, 
            dataType: 'boolean',
            visible: false,
        },
        { dataField: 'id', caption: 'ID', width: 80, visible: false },
        { 
            dataField: 'applicationNumber', 
            caption: 'Application Number', 
            width: 180,
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
        },
        { dataField: 'applicationType', caption: 'Type', width: 200 , visible: false },
        { dataField: 'applicationTypeForDisplay', caption: 'Type', width: 200 },
        { dataField: 'applicationStatus', caption: 'Status', width: 120 },
        { 
            dataField: 'supplier', 
            caption: 'Supplier', 
            minWidth: 250,
        }, 
        { dataField: 'requestor', caption: 'Requestor', width: 200 },
        { 
            dataField: 'createdAt', 
            caption: 'Request Date', 
            width: 150, 
            dataType: 'date', 
            format: 'dd/MM/yyyy', 
        },
        { dataField: 'effectiveDate', caption: 'Effective Date', width: 150, dataType: 'date', format: 'dd/MM/yyyy' , visible: false },
        { dataField: 'remark', caption: 'Remark' },
    ],

    TOOLBAR: {
        CREATE_BUTTON: {
            enabled: true,
            label: 'Create New',
            icon: 'fas fa-plus',
            dropdownIcon: 'fas fa-chevron-down',
            itemIcon: 'fas fa-file-alt',
            excludeRoles: ['verifier', 'approver'], 
        },
    },

    EMPTY_MESSAGES: {
        noAccess: {
            icon: '⛔',
            title: 'Access denied',
            description: 'You do not have permission to access this page. Please contact your administrator.'
        },
        draft: {
            icon: '📝',
            title: 'No draft applications',
            description: 'You don\'t have any draft applications at this time.'
        },
        returned: {
            icon: '↩️',
            title: 'No returned applications',
            description: 'No applications have been returned for revision.'
        },
        inProcess: {
            icon: '⚙️',
            title: 'No applications in process',
            description: 'There are no applications currently being processed.'
        },
        completed: {
            icon: '✅',
            title: 'No completed applications',
            description: 'No applications have been completed in the last 7 days.'
        },
        waitingVerified: {
            icon: '🔍',
            title: 'No applications waiting for verification',
            description: 'There are no applications pending your verification.'
        },
        waitingApprove: {
            icon: '📋',
            title: 'No applications waiting for approval',
            description: 'There are no applications pending your approval.'
        },
        approved: {
            icon: '📋',
            title: 'No approved applications',
            description: 'No applications have been approved in the last 7 days.'
        },
        verified: {
            icon: '📋',
            title: 'No verified applications',
            description: 'No applications have been verified recently.'
        },
        waitingEffective: {
            icon: '⏳',
            title: 'No applications waiting to be effective',
            description: 'There are no applications waiting for effective date.'
        },
        default: {
            icon: '📋',
            title: 'No applications found',
            description: 'There are no applications to display at this time.'
        }
    },
};