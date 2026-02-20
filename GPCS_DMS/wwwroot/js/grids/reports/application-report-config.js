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
                    onClick: (e) => handleViewDetails(e),
                },
                {
                    hint: 'Open Form',
                    icon: 'search',
                    onClick: (e) => handleOnClick(e),
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

function handleOnClick(e){
    console.log('Row clicked:', e.row.rowType);
    e.event.stopPropagation();
    if (e.row.rowType=== 'data') {
        const rowData = e.row.data;
        const url = `${window.APP_CONFIG?.host}Application/Requisition?applicationType=${rowData.applicationType}&id=${rowData.id}`;
        window.open(url, '_blank');
    }
}

async function handleViewDetails(e) {
    e.event?.stopPropagation?.();

    if (e.row.rowType !== 'data') return;

    const { applicationType, id } = e.row.data;

    const response = await Http.get(
        `${window.APP_CONFIG.baseUrl}Applications/workflow-step?applicationType=${applicationType}&applicationId=${id}`
    );

    if (!response?.success) return;

    const appData = response.data;
    showStepperPopup(appData);
}

function showStepperPopup(appData) {

    document.getElementById("workflowPopup")?.remove();

    const popup = document.createElement("div");
    popup.id = "workflowPopup";
    popup.innerHTML = `
        <div class="wf-overlay">
            <div class="wf-card">

                <div class="wf-card-header">
                    <div class="wf-card-header-left">
                        <span class="wf-eyebrow">Workflow Progress</span>
                        <span class="wf-status-badge wf-badge--${getBadgeVariant(appData.applicationStatus)}">
                            ${appData.applicationStatus ?? '—'}
                        </span>
                    </div>
                    <button class="wf-close" aria-label="Close">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <div class="wf-progress-row">
                    ${renderSummary(appData)}
                </div>

                <div class="wf-stepper-wrap">
                    ${renderStepper(appData)}
                </div>

            </div>
        </div>
    `;

    document.body.appendChild(popup);

    requestAnimationFrame(() => {
        popup.querySelector(".wf-card").classList.add("wf-card--visible");
    });

    popup.querySelector(".wf-close")
        .addEventListener("click", () => popup.remove());

    popup.querySelector(".wf-overlay")
        .addEventListener("click", (e) => {
            if (e.target.classList.contains("wf-overlay")) popup.remove();
        });
}

function getBadgeVariant(status) {
    if (!status) return 'neutral';
    const s = status.toLowerCase();
    if (s.includes('complet') || s.includes('approved') || s.includes('done')) return 'success';
    if (s.includes('reject') || s.includes('cancel') || s.includes('return')) return 'danger';
    if (s.includes('progress') || s.includes('review') || s.includes('pending')) return 'info';
    return 'neutral';
}

function renderSummary(appData) {
    const { currentStepSequence, totalSteps } = appData;

    const progressPercent = totalSteps > 0
        ? Math.round((currentStepSequence / totalSteps) * 100)
        : 0;

    return `
        <div class="wf-progress-bar-track">
            <div class="wf-progress-bar-fill" style="width:${progressPercent}%"></div>
        </div>
        <span class="wf-progress-text">
            Step ${currentStepSequence} / ${totalSteps} &nbsp;·&nbsp; ${progressPercent}%
        </span>
    `;
}

function renderStepper(appData) {

    const steps = [...appData.steps]
        .sort((a, b) => a.sequenceNo - b.sequenceNo);

    const returnStep = steps.find(step =>
        step.assignees?.some(a =>
            a.actionTaken === 'Return' ||
            a.actionTaken === 'Cancel' ||
            a.actionTaken === 'Reject'
        )
    );

    const stateList = steps.map(step => {

        let state = 'pending';
        let statusText = 'Pending';
        let iconType = 'number';

        if (returnStep) {

            if (step.sequenceNo === returnStep.sequenceNo) {
                state = 'rejected';
                statusText = appData.applicationStatus || 'Returned';
                iconType = 'cross';
            }
            else if (step.isCurrentStep) {
                state = 'current';
                statusText = 'In Progress';
            }
            else {
                state = 'pending';
                statusText = 'Pending';
            }

        }
        else {

            if (step.isCurrentStep) {
                state = 'current';
                statusText = 'In Progress';
            }
            else if (step.completedAt) {
                state = 'completed';
                statusText = 'Completed';
                iconType = 'check';
            }
        }

        return { step, state, statusText, iconType };
    });

    const cols = stateList.map(({ step, state, statusText, iconType }, idx) => {

        let iconHtml;
        if (iconType === 'check') {
            iconHtml = `<svg class="wf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else if (iconType === 'cross') {
            iconHtml = `<svg class="wf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        } else {
            iconHtml = `<span class="wf-num">${step.sequenceNo}</span>`;
        }

        const isLast   = idx === stateList.length - 1;
        const isDone   = state === 'completed';

        const colClass = [
            'wf-col',
            isLast ? 'wf-col--last' : '',
            isDone ? 'wf-col--done' : '',
        ].join(' ').trim();

        return `
            <div class="${colClass}">
                <div class="wf-dot wf-dot--${state}">${iconHtml}</div>
                <div class="wf-label">${step.stepName}</div>
                <div class="wf-sub wf-sub--${state}">${statusText}</div>
            </div>
        `;
    }).join('');

    return `<div class="wf-stepper">${cols}</div>`;
}

window.ApplicationReportGridConfig = ApplicationReportGridConfig;