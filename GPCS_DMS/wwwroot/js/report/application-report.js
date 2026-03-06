/**
 * GPCS DMS — Application Report
 * Renders application report data (info, materials, workflow, history, files).
 */
(function () {
    'use strict';

    // ─── Group of Goods Lookup ───────────────────────────────
    const _gogMap = {};

    async function loadGroupOfGoodsLookup() {
        try {
            const baseUrl = window.APP_CONFIG?.baseUrl || '';
            const resp = await fetch(`${baseUrl}groupofgoods/lookups/`, {
                credentials: 'include',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (!resp.ok) return;
            const json = await resp.json();
            const list = json?.data !== undefined ? json.data : (Array.isArray(json) ? json : []);
            list.forEach(g => { _gogMap[g.id] = g.displayName; });
        } catch (_) { /* non-critical */ }
    }

    function resolveGroupOfGoods(value) {
        if (value == null || value === '') return '-';
        return _gogMap[value] || value.toString();
    }

    // ─── Formatters ──────────────────────────────────────────
    const fmt = {
        date(v) {
            if (!v) return '-';
            return new Date(v).toLocaleDateString('th-TH', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        },
        datetime(v) {
            if (!v) return '-';
            const d = new Date(v);
            return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
                + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        },
        price(v, currency) {
            if (v == null) return '-';
            return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                + (currency ? ' ' + currency : '');
        },
        val(v) {
            return (v != null && v !== '') ? v : '-';
        }
    };

    // ─── Badge Helpers ───────────────────────────────────────
    const STATUS_MAP = {
        completed:        ['fa-check-double',  'completed'],
        approved:         ['fa-check-circle',  'approved'],
        verified:         ['fa-user-check',    'verified'],
        draft:            ['fa-pen-to-square', 'draft'],
        rejected:         ['fa-times-circle',  'rejected'],
        cancelled:        ['fa-ban',           'cancelled'],
        returned:         ['fa-undo-alt',      'returned'],
        waitingeffective: ['fa-clock',         'waiting']
    };

    function statusBadgeHtml(status) {
        const key = (status || '').toLowerCase().replace(/\s/g, '');
        const [icon, cls] = STATUS_MAP[key] || ['fa-circle-dot', 'default'];
        return `<span class="rpt-badge rpt-badge-${cls}"><i class="fa-solid ${icon}"></i>${status}</span>`;
    }

    const ACTION_CLASS_MAP = {
        submit:  'action-submit',
        approve: 'action-approve',
        reject:  'action-reject',
        return:  'action-return',
        cancel:  'action-cancel'
    };

    function actionBadgeHtml(action) {
        const cls = ACTION_CLASS_MAP[(action || '').toLowerCase()] || 'action-default';
        return `<span class="rpt-history-action ${cls}">${action || '-'}</span>`;
    }

    const TYPE_DISPLAY = {
        newmaterialsitems: 'New Materials & Items',
        newitems:          'New Item',
        edititems:         'Edit Item',
        deleteitems:       'Delete Item'
    };

    function typeDisplayName(type) {
        return TYPE_DISPLAY[(type || '').toLowerCase()] || type;
    }

    // ─── DOM Helpers ─────────────────────────────────────────
    const $ = (id) => document.getElementById(id);

    // ─── Render: Application Info ────────────────────────────
    function renderAppInfo(d) {
        const urgentHtml = d.isUrgent
            ? '<span class="rpt-urgent-badge"><i class="fa-solid fa-bolt"></i>URGENT</span>'
            : '';

        const qcsViewUrl = window.APP_CONFIG?.qcsUrl?.view || '';
        let quotationHtml = '<span style="color:#cbd5e1">&mdash;</span>';
        if (d.quotationUrl) {
            quotationHtml = qcsViewUrl
                ? `<a href="${qcsViewUrl}${d.quotationUrl}" target="_blank" rel="noopener"
                      style="color:var(--rp-primary);text-decoration:none;font-weight:500">
                      <i class="fa-solid fa-arrow-up-right-from-square me-1" style="font-size:11px"></i>${d.quotationUrl}
                   </a>`
                : `<span>${d.quotationUrl}</span>`;
        }

        const supplierHtml = d.supplierCode
            ? `${fmt.val(d.supplierName)} <span style="color:var(--rp-muted);font-size:11px">(${d.supplierCode})</span>`
            : fmt.val(d.supplierName);

        const currentStepHtml = d.currentStepName
            ? `${fmt.val(d.currentStepName)} <span style="color:var(--rp-muted);font-size:11px">&nbsp;Step ${d.currentStepSequence ?? '&mdash;'} / ${d.totalSteps ?? '&mdash;'}</span>`
            : '<span style="color:#cbd5e1">&mdash;</span>';

        const rows = [
            ['Application Type', typeDisplayName(d.applicationType), 'Quotation Ref.', quotationHtml],
            ['Requester',        fmt.val(d.requester),               'Department',     fmt.val(d.department)],
            ['Supplier',         supplierHtml,                       'Effective Date',  fmt.date(d.effectiveDate)],
            ['Created At',       fmt.datetime(d.createdAt),          'Completed At',    fmt.datetime(d.completedAt)],
            ['Current Step',     currentStepHtml,                    '',                ''],
        ];
        if (d.remark) {
            rows.push(['Remark', `<span style="font-style:italic;color:var(--rp-muted)">${d.remark}</span>`, '', '']);
        }

        const tableRows = rows.map(([l1, v1, l2, v2]) => `
            <tr>
                <td class="rpt-it-label">${l1}</td>
                <td class="rpt-it-value">${v1}</td>
                <td class="rpt-it-sep"></td>
                <td class="rpt-it-label">${l2}</td>
                <td class="rpt-it-value">${v2}</td>
            </tr>`).join('');

        $('rptAppInfo').innerHTML = `
            <div class="rpt-app-header">
                <div>
                    <div class="rpt-app-number">${fmt.val(d.applicationNumber)}</div>
                    <div class="rpt-app-type">${typeDisplayName(d.applicationType)}</div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                    ${urgentHtml}
                    ${statusBadgeHtml(d.applicationStatus)}
                </div>
            </div>
            <table class="rpt-info-table"><tbody>${tableRows}</tbody></table>`;
    }

    // ─── Render: Materials ───────────────────────────────────
    function renderMaterials(d) {
        const appType = (d.applicationType || '').toLowerCase();
        const materials = d.materials || [];

        $('rptMaterialsSectionTitle').textContent = typeDisplayName(d.applicationType);
        $('rptMaterialsNote').style.display = 'none';

        if (!materials.length) {
            $('rptMaterialsHead').innerHTML = '';
            $('rptMaterialsBody').innerHTML =
                '<tr><td colspan="14" class="text-center py-4" style="color:#94a3b8">No items</td></tr>';
            return;
        }

        const renderers = {
            newitems:          renderNewItems,
            newmaterialsitems: renderNewMaterialItems,
            edititems:         renderEditItems,
            deleteitems:       renderDeleteItems
        };
        (renderers[appType] || renderNewMaterialItems)(materials);
    }

    // ── New Items ────────────────────────────────────────────
    function renderNewItems(materials) {
        $('rptMaterialsHead').innerHTML = `<tr>
            <th>#</th><th>Material Code</th><th>Item Code</th><th>Item Description</th>
            <th>Unit</th><th>Conv. Rate</th><th>Unit Price</th><th>Currency</th>
            <th>MOQ</th><th>Lot Size</th><th>Lead Time (days)</th><th>Quotation Expiry</th>
            <th>Group of Goods</th>
        </tr>`;

        $('rptMaterialsBody').innerHTML = materials.map((m, i) => {
            const it = m.item || {};
            return `<tr>
                <td class="text-center">${i + 1}</td>
                <td>${fmt.val(m.materialCode)}</td>
                <td>${fmt.val(it.itemCode)}</td>
                <td>${fmt.val(it.itemDescription)}</td>
                <td>${fmt.val(it.itemUnit)}</td>
                <td class="text-end">${fmt.val(it.conversionRate)}</td>
                <td class="text-end">${fmt.price(it.itemUnitPrice, it.currency)}</td>
                <td>${fmt.val(it.currency)}</td>
                <td class="text-end">${fmt.val(it.moq)}</td>
                <td class="text-end">${fmt.val(it.lotSize)}</td>
                <td class="text-end">${fmt.val(it.leadTime)}</td>
                <td>${fmt.date(it.quotationExpiryDate)}</td>
                <td>${resolveGroupOfGoods(it.groupOfGoods)}</td>
            </tr>`;
        }).join('');
    }

    // ── New Material + Items ─────────────────────────────────
    function renderNewMaterialItems(materials) {
        $('rptMaterialsHead').innerHTML = `<tr>
            <th style="vertical-align:middle" rowspan="2">#</th>
            <th style="width:50px">Kind</th><th>Code</th><th>Description</th><th>Unit</th><th>Unit Price</th>
            <th style="vertical-align:middle" rowspan="2">Conv. Rate</th>
            <th style="vertical-align:middle" rowspan="2">MOQ</th>
            <th style="vertical-align:middle" rowspan="2">Lot Size</th>
            <th style="vertical-align:middle;white-space:nowrap" rowspan="2">Lead Time (days)</th>
            <th style="vertical-align:middle" rowspan="2">Currency</th>
            <th style="vertical-align:middle;white-space:nowrap" rowspan="2">Quotation Expiry</th>
            <th style="vertical-align:middle;white-space:nowrap" rowspan="2">Cost Center</th>
            <th style="vertical-align:middle" rowspan="2">Group of Goods</th>
        </tr>
        <tr><th></th><th></th><th></th><th></th><th></th></tr>`;

        $('rptMaterialsBody').innerHTML = materials.map((m, i) => {
            const it = m.item || {};
            return `
            <tr class="rpt-row-mat">
                <td class="text-center rpt-row-seq" rowspan="2">${i + 1}</td>
                <td><span class="rpt-kind-badge mat">MAT</span></td>
                <td>${fmt.val(m.materialCode)}</td>
                <td>${fmt.val(m.materialDescription)}</td>
                <td>${fmt.val(m.materialUnit)}</td>
                <td>${fmt.price(m.materialUnitPrice, 'THB')}</td>
                <td class="text-end rpt-row-shared" rowspan="2">${fmt.val(it.conversionRate)}</td>
                <td class="text-end rpt-row-shared" rowspan="2">${fmt.val(it.moq)}</td>
                <td class="text-end rpt-row-shared" rowspan="2">${fmt.val(it.lotSize)}</td>
                <td class="text-end rpt-row-shared" rowspan="2">${fmt.val(it.leadTime)}</td>
                <td class="rpt-row-shared" rowspan="2">${fmt.val(it.currency)}</td>
                <td class="rpt-row-shared" rowspan="2">${fmt.date(it.quotationExpiryDate)}</td>
                <td class="rpt-row-shared" rowspan="2">${fmt.val(m.costCenter)}</td>
                <td class="rpt-row-shared" rowspan="2">${resolveGroupOfGoods(it.groupOfGoods)}</td>
            </tr>
            <tr class="rpt-row-item">
                <td><span class="rpt-kind-badge item">ITEM</span></td>
                <td>${fmt.val(it.itemCode)}</td>
                <td>${fmt.val(it.itemDescription)}</td>
                <td>${fmt.val(it.itemUnit)}</td>
                <td>${fmt.price(it.itemUnitPrice, it.currency)}</td>
            </tr>`;
        }).join('');
    }

    // ── Edit Items ───────────────────────────────────────────
    function renderEditItems(materials) {
        function diffCell(current, history, fmtFn) {
            const curStr = fmtFn ? fmtFn(current) : fmt.val(current);
            if (history === null || history === undefined) return curStr;
            const histStr = fmtFn ? fmtFn(history) : fmt.val(history);
            if (curStr === histStr) return curStr;
            return `<div class="rpt-diff-old">${histStr}</div><div class="rpt-diff-new">${curStr}</div>`;
        }

        const note = $('rptMaterialsNote');
        note.style.cssText = 'display:flex;gap:16px;align-items:center;font-size:11px;color:#64748b;margin-bottom:8px';
        note.innerHTML = `<i class="fa-solid fa-circle-info" style="color:var(--rp-primary)"></i>
            <span>Fields that have changed show:
                <span class="rpt-diff-old" style="display:inline">Previous value</span>
                &rarr; <span class="rpt-diff-new" style="display:inline">New value</span>
            </span>`;

        $('rptMaterialsHead').innerHTML = `<tr>
            <th>#</th><th>Material Code</th><th>Item Code</th><th>Item Description</th>
            <th>Unit</th><th>Conv. Rate</th><th>Unit Price</th><th>Currency</th>
            <th>MOQ</th><th>Lot Size</th><th>Lead Time (days)</th><th>Quotation Expiry</th>
            <th>Group of Goods</th>
        </tr>`;

        $('rptMaterialsBody').innerHTML = materials.map((m, i) => {
            const it = m.item || {};
            const hist = it.itemHistory || {};
            return `<tr>
                <td class="text-center">${i + 1}</td>
                <td>${fmt.val(m.materialCode)}</td>
                <td>${fmt.val(it.itemCode)}</td>
                <td>${diffCell(it.itemDescription, hist.description)}</td>
                <td>${diffCell(it.itemUnit, hist.unit)}</td>
                <td class="text-end">${diffCell(it.conversionRate, hist.conversionRate)}</td>
                <td class="text-end">${diffCell(it.itemUnitPrice, hist.unitPrice, v => fmt.price(v, it.currency))}</td>
                <td>${diffCell(it.currency, hist.currency)}</td>
                <td class="text-end">${diffCell(it.moq, hist.moq)}</td>
                <td class="text-end">${diffCell(it.lotSize, hist.lotSize)}</td>
                <td class="text-end">${diffCell(it.leadTime, hist.leadTime)}</td>
                <td>${diffCell(it.quotationExpiryDate, hist.quotationExpiryDate, v => fmt.date(v))}</td>
                <td>${diffCell(it.groupOfGoods, hist.groupOfGoods, v => resolveGroupOfGoods(v))}</td>
            </tr>`;
        }).join('');
    }

    // ── Delete Items ─────────────────────────────────────────
    function renderDeleteItems(materials) {
        function alertCell(value) {
            const v = value ?? 0;
            return v > 0
                ? `<span class="rpt-cell-alert">${v}</span>`
                : `<span style="color:#cbd5e1">${v}</span>`;
        }

        const hasAny = materials.some(m =>
            (m.item?.po ?? 0) > 0 || (m.item?.pr ?? 0) > 0 || (m.item?.inventory ?? 0) > 0);

        if (hasAny) {
            const note = $('rptMaterialsNote');
            note.style.cssText = 'display:flex;gap:16px;align-items:center;font-size:11px;color:#64748b;margin-bottom:8px';
            note.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:#dc2626"></i>
                <span>Items highlighted in <strong style="color:#dc2626">red</strong> have active PO / PR / Inventory &mdash; review before deletion.</span>`;
        }

        $('rptMaterialsHead').innerHTML = `<tr>
            <th>#</th><th>Material Code</th><th>Item Code</th><th>Item Description</th>
            <th>Unit</th><th>Unit Price</th><th>Currency</th><th>MOQ</th><th>Lead Time (days)</th>
            <th>Quotation Expiry</th>
            <th style="background:#7f1d1d">PO</th>
            <th style="background:#7f1d1d">PR</th>
            <th style="background:#7f1d1d">Inv.</th>
        </tr>`;

        $('rptMaterialsBody').innerHTML = materials.map((m, i) => {
            const it = m.item || {};
            const hasAlert = (it.po ?? 0) > 0 || (it.pr ?? 0) > 0 || (it.inventory ?? 0) > 0;
            return `<tr${hasAlert ? ' class="rpt-row-alert"' : ''}>
                <td class="text-center">${i + 1}</td>
                <td>${fmt.val(m.materialCode)}</td>
                <td>${fmt.val(it.itemCode)}</td>
                <td>${fmt.val(it.itemDescription)}</td>
                <td>${fmt.val(it.itemUnit)}</td>
                <td class="text-end">${fmt.price(it.itemUnitPrice, it.currency)}</td>
                <td>${fmt.val(it.currency)}</td>
                <td class="text-end">${fmt.val(it.moq)}</td>
                <td class="text-end">${fmt.val(it.leadTime)}</td>
                <td>${fmt.date(it.quotationExpiryDate)}</td>
                <td class="text-center">${alertCell(it.po)}</td>
                <td class="text-center">${alertCell(it.pr)}</td>
                <td class="text-center">${alertCell(it.inventory)}</td>
            </tr>`;
        }).join('');
    }

    // ─── Render: Workflow ────────────────────────────────────
    function renderWorkflow(d) {
        const steps = (d.steps || []).slice().sort((a, b) => a.sequenceNo - b.sequenceNo);
        if (!steps.length) {
            $('rptWorkflow').innerHTML = '<span style="color:#94a3b8;font-size:12px">No workflow data.</span>';
            return;
        }

        const rows = steps.map(step => {
            const hasRejected = (step.assignees || []).some(
                a => a.actionTaken === 'Return' || a.actionTaken === 'Cancel');
            const isCompleted = !!step.completedAt;
            const isCurrent = step.isCurrentStep;

            let dotCls, statusHtml;
            if (hasRejected) {
                dotCls = 'wf-status-dot-rejected';
                statusHtml = '<span style="color:#dc2626;font-size:11px;font-weight:600">Returned / Cancelled</span>';
            } else if (isCompleted) {
                dotCls = 'wf-status-dot-completed';
                statusHtml = `<span style="color:#16a34a;font-size:11px">&#10003;&nbsp;${fmt.datetime(step.completedAt)}</span>`;
            } else if (isCurrent) {
                dotCls = 'wf-status-dot-current';
                statusHtml = '<span style="color:#2563eb;font-size:11px;font-weight:600">In Progress</span>';
            } else {
                dotCls = 'wf-status-dot-pending';
                statusHtml = '<span style="color:#94a3b8;font-size:11px">Pending</span>';
            }

            const stepBadges = [];
            if (step.isFinalStep) {
                stepBadges.push('<span class="rpt-badge rpt-badge-waiting" style="font-size:10px;padding:2px 6px;margin-left:6px">Final</span>');
            }
            if (step.executionMode === 'Parallel') {
                stepBadges.push('<span style="font-size:10px;color:#64748b;margin-left:6px">[Parallel]</span>');
            }

            const assigneesHtml = (step.assignees || []).map(a => {
                const initials = (a.employeeName || '').split(' ')
                    .map(w => w[0]).slice(0, 2).join('').toUpperCase();
                const actionBadge = a.hasActioned
                    ? actionBadgeHtml(a.actionTaken)
                    : '<span style="color:#94a3b8;font-size:11px">Pending</span>';
                const dateHtml = a.actionedAt
                    ? `<span class="wf-assignee-comment ms-2">${fmt.datetime(a.actionedAt)}</span>` : '';
                const commentHtml = a.comments
                    ? `<div class="wf-assignee-comment"><i class="fa-solid fa-comment-dots me-1"></i>${a.comments}</div>` : '';

                return `<div class="wf-assignee-row">
                    <div class="wf-assignee-avatar">${initials}</div>
                    <div class="flex-grow-1">
                        <div class="wf-assignee-name">${fmt.val(a.employeeName)}</div>
                        <div class="d-flex align-items-center flex-wrap gap-1 mt-1">${actionBadge}${dateHtml}</div>
                        ${commentHtml}
                    </div>
                </div>`;
            }).join('');

            return `<tr>
                <td class="wf-step-seq">${step.sequenceNo}</td>
                <td><span style="font-weight:600;font-size:12px">${step.stepName}</span>${stepBadges.join('')}</td>
                <td><span class="wf-status-dot ${dotCls}"></span>${statusHtml}</td>
                <td>${assigneesHtml || '<span style="color:#94a3b8;font-size:11px">—</span>'}</td>
            </tr>`;
        }).join('');

        $('rptWorkflow').innerHTML = `
            <table class="wf-table">
                <thead><tr>
                    <th style="width:36px">#</th><th>Step</th>
                    <th style="width:210px">Status</th><th>Assignees</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
    }

    // ─── Render: History ─────────────────────────────────────
    function renderHistory(d) {
        const histories = d.histories || [];
        if (!histories.length) {
            $('rptHistoryBody').innerHTML =
                '<tr><td colspan="6" class="text-center text-muted py-3">No history</td></tr>';
            return;
        }

        $('rptHistoryBody').innerHTML = histories.map((h, i) =>
            `<tr>
                <td class="text-center">${i + 1}</td>
                <td>Step ${h.stepSequenceNo}: ${fmt.val(h.stepName)}</td>
                <td>${fmt.val(h.fullName)}<div class="rpt-cell-sub">${fmt.val(h.nId)}</div></td>
                <td>${actionBadgeHtml(h.actionType)}</td>
                <td>${fmt.val(h.comments)}</td>
                <td>${fmt.datetime(h.createdAt)}</td>
            </tr>`
        ).join('');
    }

    // ─── Render: File Attachments ────────────────────────────
    const FILE_ICON_MAP = [
        ['pdf',   'fa-file-pdf'],
        ['image', 'fa-file-image'],
        ['word',  'fa-file-word'],
        ['document', 'fa-file-word'],
        ['excel', 'fa-file-excel'],
        ['sheet', 'fa-file-excel']
    ];

    function fileIcon(contentType) {
        if (!contentType) return 'fa-file';
        const ct = contentType.toLowerCase();
        for (const [key, icon] of FILE_ICON_MAP) {
            if (ct.includes(key)) return icon;
        }
        return 'fa-file';
    }

    function renderFiles(d) {
        const files = d.fileAttachments || [];
        const container = $('rptFilesList');

        if (!files.length) {
            container.innerHTML = '<span class="text-muted">No file attachments.</span>';
            return;
        }

        container.innerHTML = files.map(f => {
            const safeName = (f.fileName || '').replace(/'/g, "\\'");
            return `<div class="rpt-file-item">
                <i class="fa-solid ${fileIcon(f.contentType)} rpt-file-icon"></i>
                <div class="flex-grow-1" style="cursor:pointer;min-width:0"
                     onclick="_previewFileById(${f.id}, '${safeName}')">
                    <div class="rpt-file-name" style="color:var(--rp-primary);text-decoration:underline;text-underline-offset:2px">
                        ${fmt.val(f.fileName)}
                    </div>
                    <div class="rpt-file-meta">
                        ${fmt.val(f.fileSizeDisplay)} &bull; Uploaded ${fmt.datetime(f.createdAt)} by ${fmt.val(f.createdBy)}
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-primary ms-2" style="border-radius:0"
                        onclick="_previewFileById(${f.id}, '${safeName}')" title="Preview">
                    <i class="fa-solid fa-eye"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary ms-1" style="border-radius:0"
                        onclick="_downloadFileById(${f.id}, '${safeName}')" title="Download">
                    <i class="fa-solid fa-download"></i>
                </button>
            </div>`;
        }).join('');
    }

    // ─── File Preview / Download ─────────────────────────────
    window._previewFileById = function (id) {
        const baseUrl = window.APP_CONFIG?.baseUrl || '';
        window.open(`${baseUrl}file-attachments/${id}/preview/`, '_blank', 'noopener');
    };

    window._downloadFileById = async function (id, fileName) {
        const baseUrl = window.APP_CONFIG?.baseUrl || '';
        const url = `${baseUrl}file-attachments/${id}/download/`;
        try {
            const resp = await fetch(url, {
                credentials: 'include',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const disposition = resp.headers.get('Content-Disposition') || '';
            const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";\r\n]+)/i);
            const dlName = match ? decodeURIComponent(match[1].replace(/"/g, '')) : fileName;

            const blob = await resp.blob();
            const objUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objUrl;
            link.download = dlName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objUrl);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Download failed: ' + err.message);
        }
    };

    // ─── Main Entry Point ────────────────────────────────────
    async function loadAndRender() {
        const applicationType = $('applicationType').value;
        const applicationId = $('applicationId').value;

        if (!applicationType || !applicationId) {
            $('rptLoading').style.display = 'none';
            $('rptErrorMsg').textContent = 'Application type or ID is missing.';
            $('rptError').style.display = 'block';
            return;
        }

        try {
            const baseUrl = window.APP_CONFIG?.baseUrl || '';
            const url = `${baseUrl}applications/workflow/${applicationType}/${applicationId}`;

            const [resp] = await Promise.all([
                fetch(url, {
                    credentials: 'include',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                }),
                loadGroupOfGoodsLookup()
            ]);

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const json = await resp.json();
            const data = json?.data !== undefined ? json.data : json;
            if (!data) throw new Error('No data returned from API.');

            renderAppInfo(data);
            renderMaterials(data);
            renderWorkflow(data);
            renderHistory(data);
            renderFiles(data);

            $('rptLoading').style.display = 'none';
            $('rptContent').style.display = 'block';
        } catch (err) {
            console.error(err);
            $('rptLoading').style.display = 'none';
            $('rptErrorMsg').textContent = 'Failed to load application data: ' + err.message;
            $('rptError').style.display = 'block';
        }
    }

    document.addEventListener('DOMContentLoaded', loadAndRender);
})();
