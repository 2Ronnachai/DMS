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
                // {
                //     hint: 'View Details',
                //     icon: 'info',
                //     onClick: (e) => handleViewDetails(e),
                // },
                {
                    hint: 'Print',
                    icon: 'print',
                    onClick: (e) => handleViewReport(e),
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
        if (e.rowType === 'data') {
            e.rowElement.css('cursor', 'pointer');
        }
    },
    onRowClick: async (e) => handleOnRowClick(e)
};

function handleOnClick(e) {
    e.event.stopPropagation();
    if (e.row.rowType === 'data') {
        const rowData = e.row.data;
        const url = `${window.APP_CONFIG?.host}Application/Requisition?applicationType=${rowData.applicationType}&id=${rowData.id}`;
        window.open(url, '_blank');
    }
}

function handleViewReport(e) {
    e.event.stopPropagation();
    if (e.row.rowType === 'data') {
        const rowData = e.row.data;
        const url = `${window.APP_CONFIG?.host}Application/Report?applicationType=${rowData.applicationType}&id=${rowData.id}`;
        // navigate to report page on this tab
        window.location.href = url;

    }
}

async function handleOnRowClick(e) {
    if (e.rowType === 'data') {
        const rowData = e.data;
        const loadingId = appLoading.show('Loading workflow details...');
        const url = `${window.APP_CONFIG.baseUrl}Applications/workflow-step?applicationType=${rowData.applicationType}&applicationId=${rowData.id}`
        try {
            const response = await Http.get(url);
            if (response?.success) {
                const appData = response.data;
                showStepperPopup(appData);
            }
        } catch (error) {
            appNotification.show('Failed to load workflow details: ' + error.message, 'error');
        }finally{
            appLoading.hide(loadingId);
        }
    }
}

// async function handleViewDetails(e) {
//     e.event?.stopPropagation?.();

//     if (e.row.rowType !== 'data') return;

//     const { applicationType, id } = e.row.data;

//     const response = await Http.get(
//         `${window.APP_CONFIG.baseUrl}Applications/workflow-step?applicationType=${applicationType}&applicationId=${id}`
//     );

//     if (!response?.success) return;

//     const appData = response.data;
//     showStepperPopup(appData);
// }

/* ── Utility helpers ── */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getFirstName(fullName) {
    if (!fullName) return '—';
    return fullName.split(' ')[0];
}

function formatWfDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatWfDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}, ${hours}:${mins}`;
}

function getBadgeVariant(status) {
    if (!status) return 'neutral';
    const s = status.toLowerCase();
    if (s.includes('complet') || s.includes('approved') || s.includes('done')) return 'success';
    if (s.includes('reject') || s.includes('cancel') || s.includes('return')) return 'danger';
    if (s.includes('progress') || s.includes('review') || s.includes('pending')) return 'info';
    return 'neutral';
}

/* ── Section renderers ── */
function renderAppInfo(d) {
    return `
        <div class="wf-section">
            <div class="wf-section-title">APPLICATION INFO</div>
            <div class="wf-app-number">${escapeHtml(d.applicationNumber)}</div>
            <div class="wf-app-tags">
                ${d.isUrgent ? '<span class="wf-tag wf-tag--warning"><i class="fas fa-exclamation-circle" style="margin-right:4px"></i>URGENT</span>' : ''}
                <span class="wf-tag wf-tag--${getBadgeVariant(d.applicationStatus)}">${escapeHtml((d.applicationStatus || '').toUpperCase())}</span>
                <span class="wf-tag wf-tag--neutral">${escapeHtml((d.applicationType || '').toUpperCase())}</span>
            </div>
        </div>`;
}

function renderSummarySection(d) {
    const matCount = d.totalMaterials ?? 0;
    const itemCount = d.totalItems ?? 0;
    const quotation = d.quotationUrl || '—';

    const quotationHtml = d.quotationUrl
        ? `<a class="wf-stat-link" href="${window.APP_CONFIG.qcsUrl.view}${escapeHtml(d.quotationUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(quotation)}</a>`
        : escapeHtml(quotation);

    return `
        <div class="wf-section">
            <div class="wf-section-title">SUMMARY</div>
            <div class="wf-stats-row">
                <div class="wf-stat-card">
                    <div class="wf-stat-label">STEPS</div>
                    <div class="wf-stat-value">
                        <span class="wf-stat-big">${d.currentStepSequence ?? 0}</span><span class="wf-stat-small">/${d.totalSteps ?? 0}</span>
                    </div>
                </div>
                <div class="wf-stat-card">
                    <div class="wf-stat-label">MATERIALS</div>
                    <div class="wf-stat-value"><span class="wf-stat-big">${matCount}</span></div>
                </div>
                <div class="wf-stat-card">
                    <div class="wf-stat-label">ITEMS</div>
                    <div class="wf-stat-value"><span class="wf-stat-big">${itemCount}</span></div>
                </div>
                <div class="wf-stat-card">
                    <div class="wf-stat-label">QUOTATION</div>
                    <div class="wf-stat-value wf-stat-value--text">${quotationHtml}</div>
                </div>
            </div>
        </div>`;
}

function renderDetailsSection(d) {
    return `
        <div class="wf-section">
            <div class="wf-section-title">DETAILS</div>
            <div class="wf-details">
                <div class="wf-detail-row">
                    <div class="wf-detail-cell">
                        <div class="wf-detail-label">SUPPLIER CODE</div>
                        <div class="wf-detail-value">${escapeHtml(d.supplierCode)}</div>
                    </div>
                    <div class="wf-detail-cell">
                        <div class="wf-detail-label">SUPPLIER</div>
                        <div class="wf-detail-value">${escapeHtml(d.supplierName)}</div>
                    </div>
                </div>
                <div class="wf-detail-row">
                    <div class="wf-detail-cell">
                        <div class="wf-detail-label">REQUESTER</div>
                        <div class="wf-detail-value">${escapeHtml(d.requester)}</div>
                    </div>
                    <div class="wf-detail-cell">
                        <div class="wf-detail-label">DEPARTMENT</div>
                        <div class="wf-detail-value">${escapeHtml(d.department)}</div>
                    </div>
                </div>
                <div class="wf-detail-row">
                    <div class="wf-detail-cell">
                        <div class="wf-detail-label">EFFECTIVE DATE</div>
                        <div class="wf-detail-value">${formatWfDate(d.effectiveDate)}</div>
                    </div>
                    <div class="wf-detail-cell">
                        <div class="wf-detail-label">COMPLETED AT</div>
                        <div class="wf-detail-value">${d.completedAt ? formatWfDateTime(d.completedAt) : '—'}</div>
                    </div>
                </div>
            </div>
        </div>`;
}

function renderWorkflowSection(d) {
    const steps = [...(d.steps || [])].sort((a, b) => a.sequenceNo - b.sequenceNo);

    const returnStep = steps.find(step =>
        step.assignees?.some(a =>
            a.actionTaken === 'Return' || a.actionTaken === 'Cancel' || a.actionTaken === 'Reject'
        )
    );

    const stepColumns = steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        let dotClass = 'wf-sdot--pending';

        if (returnStep) {
            if (step.sequenceNo === returnStep.sequenceNo) dotClass = 'wf-sdot--rejected';
            else if (step.isCurrentStep) dotClass = 'wf-sdot--current';
        } else {
            if (step.completedAt) dotClass = 'wf-sdot--completed';
            else if (step.isCurrentStep) dotClass = 'wf-sdot--current';
        }

        const isCompleted = dotClass === 'wf-sdot--completed';
        const isRejected = dotClass === 'wf-sdot--rejected';

        let iconHtml;
        if (isCompleted) {
            iconHtml = `<svg class="wf-sdot-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else if (isRejected) {
            iconHtml = `<svg class="wf-sdot-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        } else {
            iconHtml = `<span class="wf-sdot-num">${step.sequenceNo}</span>`;
        }

        const assigneesHtml = (step.assignees || []).map(a => {
            const indicatorClass = a.hasActioned ? 'wf-aind--active' : 'wf-aind--inactive';
            const name = getFirstName(a.employeeName);
            const action = a.actionTaken
                ? `<span class="wf-aaction wf-aaction--${a.actionTaken.toLowerCase()}">${escapeHtml(a.actionTaken.toUpperCase())}</span>`
                : `<span class="wf-aaction wf-aaction--none">—</span>`;
            return `
                <div class="wf-assignee">
                    <span class="wf-aind ${indicatorClass}"></span>
                    <span class="wf-aname">${escapeHtml(name)}</span>
                    ${action}
                </div>`;
        }).join('');

        return `
            <div class="wf-scol ${isLast ? 'wf-scol--last' : ''} ${isCompleted ? 'wf-scol--done' : ''}">
                <div class="wf-sdot ${dotClass}">${iconHtml}</div>
                <div class="wf-sname">${escapeHtml(step.stepName)}</div>
                <div class="wf-assignees">${assigneesHtml}</div>
            </div>`;
    }).join('');

    return `
        <div class="wf-section wf-section--workflow">
            <div class="wf-section-title">WORKFLOW STEPS</div>
            <div class="wf-stepper-container">
                ${stepColumns}
            </div>
        </div>`;
}

/* ── Main popup ── */
function showStepperPopup(appData) {
    console.log('App Data:', appData);
    document.getElementById("workflowPopup")?.remove();

    const popup = document.createElement("div");
    popup.id = "workflowPopup";
    popup.innerHTML = `
        <div class="wf-overlay">
            <div class="wf-card">
                <button class="wf-close-btn" aria-label="Close">&times;</button>
                ${renderAppInfo(appData)}
                ${renderSummarySection(appData)}
                ${renderDetailsSection(appData)}
                ${renderWorkflowSection(appData)}
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    requestAnimationFrame(() => {
        popup.querySelector(".wf-card").classList.add("wf-card--visible");
    });

    popup.querySelector(".wf-close-btn")
        .addEventListener("click", () => popup.remove());

    popup.querySelector(".wf-overlay")
        .addEventListener("click", (e) => {
            if (e.target.classList.contains("wf-overlay")) popup.remove();
        });
}

window.ApplicationReportGridConfig = ApplicationReportGridConfig;