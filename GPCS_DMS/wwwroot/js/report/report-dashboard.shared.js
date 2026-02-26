(function (window) {
    'use strict';

    // Shared helpers + widget initialization for Report Dashboard.
    // This file must be loaded BEFORE report-dashboard.js.

    if (window.ReportDashboardShared) {
        return;
    }

    const Shared = {};

    Shared.ensureDx = function ensureDx() {
        if (!window.DevExpress || !window.DevExpress.ui) {
            console.error('DevExtreme not found. Ensure dx.all.js is loaded.');
            return false;
        }
        return true;
    };

    Shared.getConfig = function getConfig() {
        const cfg = window.ReportDashboardConfig || {};
        const endpoints = cfg.endpoints || {};
        return {
            endpoints: {
                dashboard: endpoints.dashboard || 'dashboard',
                applications: endpoints.applications || 'dashboard/applications',
                monitoring: endpoints.monitoring || 'dashboard/monitoring',
                masterData: endpoints.masterData || 'dashboard/masterdata',
                supplierPurchaserDrilldown: endpoints.supplierPurchaserDrilldown || 'dashboard/master-data/suppliers-purchasers/drilldown',
                applicationsDrilldown: endpoints.applicationsDrilldown || 'dashboard/applications/drilldown',
                materialsDrilldown: endpoints.materialsDrilldown || 'dashboard/monitoring/materials/drilldown',
                itemsDrilldown: endpoints.itemsDrilldown || 'dashboard/monitoring/items/drilldown',
            }
        };
    };

    Shared._groupOfGoodsLookupStorePromise = null;
    Shared.getGroupOfGoodsLookupStore = async function getGroupOfGoodsLookupStore() {
        if (Shared._groupOfGoodsLookupStorePromise) return Shared._groupOfGoodsLookupStorePromise;

        Shared._groupOfGoodsLookupStorePromise = (async () => {
            if (!Shared.ensureDx()) return null;
            try {
                const resp = await Http.getCache('groupofgoods/lookups/', 10 * 60 * 1000);
                const data = (resp && resp.success && Array.isArray(resp.data)) ? resp.data : [];

                if (window.DevExpress?.data?.ArrayStore) {
                    return new DevExpress.data.ArrayStore({
                        key: 'id',
                        data
                    });
                }

                // Fallback (ArrayStore not available) - dxDataGrid lookup can accept arrays too.
                return data;
            } catch (error) {
                console.error('Failed to load Group of Goods lookup:', error);
                if (window.DevExpress?.data?.ArrayStore) {
                    return new DevExpress.data.ArrayStore({ key: 'id', data: [] });
                }
                return [];
            }
        })();

        return Shared._groupOfGoodsLookupStorePromise;
    };

    Shared.buildUrl = function buildUrl(url, query) {
        const u = new URL(url, window.APP_CONFIG?.baseUrl || window.location.origin);
        const q = query || {};
        Object.keys(q).forEach(k => {
            const v = q[k];
            if (v === undefined || v === null || v === '') return;
            u.searchParams.set(k, String(v));
        });
        return u.toString();
    };

    Shared.formatNumber = function formatNumber(n) {
        const x = Number(n) || 0;
        return x.toLocaleString('en-US');
    };

    Shared.toDate = function toDate(value) {
        if (!value) return null;
        if (value instanceof Date) return value;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    };

    Shared.startOfDay = function startOfDay(d) {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
    };

    Shared.addDays = function addDays(d, days) {
        const x = new Date(d);
        x.setDate(x.getDate() + days);
        return x;
    };

    function pad2(n) {
        return (n < 10 ? '0' : '') + n;
    }

    Shared.formatYMD = function formatYMD(d) {
        const x = new Date(d);
        return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
    };

    Shared.formatDMY = function formatDMY(d) {
        const x = new Date(d);
        return `${pad2(x.getDate())}-${pad2(x.getMonth() + 1)}-${x.getFullYear()}`;
    };

    Shared.monthKey = function monthKey(d) {
        const x = new Date(d);
        return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}`;
    };

    Shared.defaultRangeForPeriod = function defaultRangeForPeriod(period) {
        const now = new Date();
        if (period === 'daily') return { start: Shared.addDays(now, -13), end: now };           // 14 days total to show more trend in daily view
        if (period === 'weekly') return { start: Shared.addDays(now, -7 * 11), end: now };      // 12 weeks total to show more trend in weekly view
        if (period === 'monthly') return { start: Shared.addDays(now, -30 * 11), end: now };    // 12 months total to show more trend in monthly view
        if (period === 'yearly') return { start: Shared.addDays(now, -365 * 4), end: now };     // 5 years total to show more trend in yearly view
        // range
        return { start: Shared.addDays(now, -13), end: now };
    };

    Shared.renderKpiStrip = function renderKpiStrip(container, items) {
        if (!container) return;
        const list = Array.isArray(items) ? items : [];
        container.innerHTML = list.map(x => `
            <div class="report-kpi-item">
                <div class="report-kpi-label">${x.label}</div>
                <div class="report-kpi-value">${Shared.formatNumber(x.value)}</div>
                ${x.hint ? `<div class="report-kpi-hint">${x.hint}</div>` : ''}
            </div>
        `).join('');
    };

    Shared.asDomElement = function asDomElement(el) {
        if (!el) return null;
        if (el.nodeType) return el;
        // jQuery / DevExtreme renderer wrappers
        if (typeof el.get === 'function') return el.get(0);
        if (el[0] && el[0].nodeType) return el[0];
        return null;
    };

    Shared.initFilterWidgets = function initFilterWidgets(dashboard) {
        const items = [
            { id: 'daily', text: 'Daily' },
            { id: 'weekly', text: 'Weekly' },
            { id: 'monthly', text: 'Monthly' },
            { id: 'yearly', text: 'Yearly' },
            { id: 'range', text: 'Range' }
        ];

        dashboard.widgets.periodSelectBox = $(dashboard.periodEl).dxSelectBox({
            items,
            valueExpr: 'id',
            displayExpr: 'text',
            value: dashboard.period,
            width: 210,
            onValueChanged: (e) => {
                dashboard.period = e.value || 'daily';
                const showRange = dashboard.period === 'range';
                if (dashboard.dateRangeWrapper) dashboard.dateRangeWrapper.style.display = showRange ? '' : 'none';

                if (!showRange) {
                    const range = Shared.defaultRangeForPeriod(dashboard.period);
                    dashboard.startDate = Shared.startOfDay(range.start);
                    dashboard.endDate = range.end;
                    dashboard.widgets.dateRangeBox?.option('value', [dashboard.startDate, dashboard.endDate]);
                }

                // Only reload Applications section when filters change
                dashboard.refreshApplications();
            }
        }).dxSelectBox('instance');

        dashboard.widgets.dateRangeBox = $(dashboard.dateRangeEl).dxDateRangeBox({
            value: [dashboard.startDate, dashboard.endDate],
            width: 320,
            displayFormat: 'dd-MM-yyyy',
            startDatePlaceholder: 'Start',
            endDatePlaceholder: 'End',
            showClearButton: false,
            labelMode: 'hidden',
            onValueChanged: (e) => {
                if (dashboard.period !== 'range') return;
                const v = e.value || [];
                const s = Shared.toDate(v[0]);
                const en = Shared.toDate(v[1]);
                if (s && en) {
                    dashboard.startDate = Shared.startOfDay(s);
                    dashboard.endDate = en;
                    // Only reload Applications section when filters change
                    dashboard.refreshApplications();
                }
            }
        }).dxDateRangeBox('instance');

        // initial visibility
        if (dashboard.dateRangeWrapper) {
            dashboard.dateRangeWrapper.style.display = dashboard.period === 'range' ? '' : 'none';
        }
    };

    Shared.initStaticWidgets = function initStaticWidgets(dashboard) {
        const self = dashboard;

        dashboard.widgets.calendar = $(dashboard.calendarEl).dxCalendar({
            value: new Date(),
            firstDayOfWeek: 0,
            showTodayButton: true,
            height: '100%',
            cellTemplate: function (cellData, cellIndex, cellElement) {
                // cellData: { date, text, view }
                const date = cellData?.date;
                const text = cellData?.text;
                const key = date ? Shared.formatYMD(date) : '';
                const events = key ? self._calendarEventMap.get(key) : null;

                const host = Shared.asDomElement(cellElement);
                if (!host) return;

                // Clear cell and render our wrapper to avoid affecting calendar table layout
                host.innerHTML = '';
                const wrap = document.createElement('div');
                wrap.className = 'report-cal-cell';
                wrap.textContent = text;

                if (events && events.length) {
                    // Prefer holiday > inventory > monthClose
                    const types = events.map(e => e.type);
                    const type = types.includes('holiday') ? 'holiday'
                        : types.includes('inventory') ? 'inventory'
                            : types.includes('monthClose') ? 'monthClose'
                                : types[0];

                    const dot = document.createElement('span');
                    dot.className = `report-calendar-dot report-calendar-dot--${type}`;
                    wrap.appendChild(dot);
                }

                host.appendChild(wrap);
            },
            onValueChanged: function (e) {
                self.renderCalendarEvents(e.value);
            }
        }).dxCalendar('instance');

        // Ensure selected date is visible immediately (even before any click)
        try {
            self.renderCalendarEvents(dashboard.widgets.calendar?.option('value') || new Date());
        } catch {
            // ignore
        }

        const wafuPalette = [
            '#1890ff',
            '#faad14',
            '#52c41a',
            '#ff7875',
            '#13c2c2',
            '#b37feb'
        ];

        dashboard.widgets.createdApplicationsChart = $(dashboard.createdChartEl).dxChart({
            dataSource: [],
            palette: wafuPalette,
            commonSeriesSettings: {
                argumentField: 'bucket',
                type: 'line',
                point: { visible: false },
                border: { visible: false }
            },
            series: [
                { valueField: 'newMaterialsItems', name: 'New Material Items', color: '#1890ff' },
                { valueField: 'newItems', name: 'New Items', color: '#faad14' },
                { valueField: 'editItems', name: 'Edit Items', color: '#52c41a' },
                { valueField: 'deleteItems', name: 'Delete Items', color: '#ff7875' },
                { valueField: 'totalItems', name: 'Total Items', color: '#13c2c2' }
            ],
            tooltip: {
                enabled: true,
                format: 'fixedPoint',
                customizeTooltip(arg) {
                    return { text: `${arg.seriesName}: ${arg.valueText} items` };
                }
            },
            legend: {
                visible: true,
                position: 'bottom',
            },
            argumentAxis: {
                label: { overlappingBehavior: 'rotate', rotationAngle: 45, font: { color: '#595959' } },
                grid: { visible: false }
            },
            valueAxis: {
                allowDecimals: false,
                label: { font: { color: '#595959' } },
                grid: { color: '#f0f0f0', opacity: 0.3 }
            },
            animation: { easing: 'easeOutCubic' }
        }).dxChart('instance');

        dashboard.widgets.applicationStatusPieChart = $(dashboard.statusPieEl).dxPieChart({
            dataSource: [],
            palette: wafuPalette,
            series: [{
                argumentField: 'status',
                valueField: 'count',
                label: {
                    visible: true,
                    connector: { visible: true, color: '#d9d9d9' },
                }
            }],
            legend: {
                horizontalAlignment: 'center',
                verticalAlignment: 'bottom',
            },
            tooltip: { enabled: true, format: 'percent', customizeTooltip(arg) { return { text: arg.argumentText + ': ' + arg.percentText }; } },
            animation: { easing: 'easeOutCubic' }
        }).dxPieChart('instance');

        Shared.initTypePurchaserDrilldownPopup(dashboard);

        function onCellPrepared(e) {
            if (e.area === 'data') {
                const isTotal =
                    e.cell.columnType === 'T' || e.cell.rowType === 'T' ||
                    e.cell.columnType === 'GT' || e.cell.rowType === 'GT';

                if (!isTotal) {
                    e.cellElement.css('cursor', 'pointer');

                    // Hover in
                    e.cellElement.on('mouseenter', function () {
                        $(this).css('background-color', '#e6f2ff');
                    });

                    // Hover out
                    e.cellElement.on('mouseleave', function () {
                        $(this).css('background-color', '');
                    });
                }
            }
        }

        dashboard.widgets.typePurchaserPivotGrid = $(dashboard.typePurchaserPivotGridEl).dxPivotGrid({
            dataSource: {
                fields: [
                    {
                        caption: 'Department',
                        width: 200,
                        dataField: 'department',
                        area: 'row',
                        headerFilter: {
                            search: {
                                enabled: true,
                            },
                        },
                    },
                    {
                        caption: 'Application Type',
                        width: 200,
                        dataField: 'applicationType',
                        area: 'row',
                        headerFilter: {
                            search: {
                                enabled: true,
                            },
                        },
                    },
                    {
                        caption: 'Purchaser',
                        dataField: 'purchaser',
                        area: 'column'
                    },
                    {
                        caption: 'Count',
                        dataField: 'count',
                        area: 'data',
                        summaryType: 'sum'
                    },
                ],
                store: []
            },
            allowSortingBySummary: true,
            allowSorting: true,
            allowFiltering: true,
            allowExpandAll: true,
            fieldChooser: {
                enabled: true,
            },
            showRowGrandTotals: true,
            showColumnGrandTotals: true,
            showBorders: true,
            texts: {
                grandTotal: 'Total All',
                total: 'Sub Total'
            },
            onCellClick: function (e) {
                if (e.area !== 'data') return;

                if (e.cell.columnType === 'GT' || e.cell.rowType === 'GT' ||
                    e.cell.columnType === 'T' || e.cell.rowType === 'T') {
                    return;
                }

                const queryParams = this.getQueryParams ? this.getQueryParams() : null;

                const pivotGrid = e.component;

                const drillDownDataSource =
                    pivotGrid.getDataSource().createDrillDownDataSource(e.cell);

                drillDownDataSource.load().done(async (data) => {
                    const rawRows = Array.isArray(data) ? data : [];
                    const rowPath = Array.isArray(e.cell?.rowPath) ? e.cell.rowPath : [];
                    const columnPath = Array.isArray(e.cell?.columnPath) ? e.cell.columnPath : [];

                    // Pivot field order in this grid:
                    // rows: [department, applicationType], columns: [purchaser]
                    const cellFilters = {
                        department: rowPath.length > 0 ? rowPath[0] : null,
                        applicationType: rowPath.length > 1 ? rowPath[1] : null,
                        purchaser: columnPath.length > 0 ? columnPath[0] : null,
                    };

                    const filters = data.map(r => {
                        return {
                            applicationType: r.applicationType,
                            department: r.department,
                            purchaser: r.purchaser,
                        };
                    });

                    const payload = {
                        period: queryParams?.period || dashboard.period,
                        startDate: queryParams?.startDate || Shared.formatYMD(dashboard.startDate),
                        endDate: queryParams?.endDate || Shared.formatYMD(dashboard.endDate),
                        filters: filters
                    };

                    let gridData = rawRows;
                    let options = null;
                    const drilldownEndpoint = dashboard?.config?.endpoints?.applicationsDrilldown;

                    // If you have an API for drilldown, this will POST payload and use response data.
                    if (drilldownEndpoint) {
                        const loadingId = appLoading.show('Loading details...');
                        try {
                            const ctrl = Http.createAbortController('applicationsDrilldown');
                            const resp = await Http.post(drilldownEndpoint, payload, { signal: ctrl.signal });

                            if (resp && resp.success) {
                                gridData = Array.isArray(resp.data)
                                    ? resp.data
                                    : (resp.data ? [resp.data] : []);

                                options = {
                                    columns: [
                                        { dataField: "applicationNumber", caption: "Application No.", minWidth: 180 },
                                        { dataField: "applicationType", caption: "Type", minWidth: 160 },
                                        {
                                            dataField: "applicationStatus",
                                            caption: "Status",
                                            width: 120,
                                            cellTemplate: (container, options) => {
                                                const cfg = Shared.getStatusConfig(options.value);
                                                $('<span>')
                                                    .addClass(`status-badge status-${cfg.class}`)
                                                    .text(cfg.label || options.value)
                                                    .appendTo(container);
                                            }
                                        },
                                        { dataField: "supplierName", caption: "Supplier Name" },
                                        { dataField: "department", caption: "Department" },
                                        { dataField: "requestor", caption: "Requestor", minWidth: 160 },
                                        { dataField: "effectiveDate", caption: "Effective Date", dataType: "datetime", format: "dd/MM/yyyy" },
                                        { dataField: "isUrgent", caption: "Urgent", customizeText: e => e.value ? "Yes" : "No" },
                                        { dataField: "remark", caption: "Remark" },
                                        { dataField: "createdAt", caption: "Created Date", dataType: "datetime", format: "dd/MM/yyyy HH:mm" }
                                    ]
                                };
                            } else {
                                appNotification?.error?.(resp?.message || 'Failed to load drilldown data.', { duration: 5000 });
                            }
                        } catch (err) {
                            if (err && err.name === 'AbortError') return;
                            console.error(err);
                            appNotification?.error?.('Failed to load drilldown data. Please try again later.', { duration: 5000 });
                        } finally {
                            appLoading.hide(loadingId);
                        }
                    }

                    Shared.showTypePurchaserDrilldownPopup(dashboard, {
                        titleParts: [cellFilters.department, cellFilters.applicationType, cellFilters.purchaser].filter(Boolean),
                        data: gridData,
                        payload,
                        ...options
                    });
                });
            }.bind(dashboard),
            onCellPrepared: (e) => onCellPrepared(e)
        }).dxPivotGrid('instance');

        Shared.initTypeCategoryDrilldownPopup(dashboard);

        dashboard.widgets.userTypeCategoryPivotGrid = $(dashboard.userTypeCategoryPivotGridEl).dxPivotGrid({
            dataSource: {
                fields: [
                    {
                        caption: 'Purchaser',
                        dataField: 'purchaser',
                        area: 'row',
                        headerFilter: {
                            search: {
                                enabled: true,
                            },
                        },
                    },
                    {
                        caption: 'Category',
                        dataField: 'category',
                        area: 'column',
                        headerFilter: {
                            search: {
                                enabled: true,
                            },
                        },
                    },
                    {
                        caption: 'Total Material',
                        dataField: 'totalMaterial',
                        area: 'data',
                        summaryType: 'sum'
                    },
                    {
                        caption: 'Total Item',
                        dataField: 'totalItem',
                        area: 'data',
                        summaryType: 'sum'
                    }
                ],
                store: []
            },
            allowSortingBySummary: true,
            allowSorting: true,
            allowFiltering: true,
            allowExpandAll: true,
            fieldChooser: {
                enabled: true,
            },
            showRowGrandTotals: true,
            showColumnGrandTotals: true,
            showBorders: true,
            texts: {
                grandTotal: 'Total All',
                total: 'Sub Total'
            },
            height: 'auto',
            onCellClick: function (e) {
                if (e.area !== 'data') return;

                if (e.cell.columnType === 'GT' || e.cell.rowType === 'GT' ||
                    e.cell.columnType === 'T' || e.cell.rowType === 'T') {
                    return;
                }

                const dataFields = e.component
                    .getDataSource()
                    .fields()
                    .filter(f => f.area === 'data');

                const clickedField = dataFields[e.cell.dataIndex];

                const pivotGrid = e.component;

                const drillDownDataSource =
                    pivotGrid.getDataSource().createDrillDownDataSource(e.cell);

                drillDownDataSource.load().done(async (data) => {
                    const rawRows = Array.isArray(data) ? data : [];
                    const rowPath = Array.isArray(e.cell?.rowPath) ? e.cell.rowPath : [];
                    const columnPath = Array.isArray(e.cell?.columnPath) ? e.cell.columnPath : [];
                    const cellFilters = {
                        purchaser: rowPath.length > 0 ? rowPath[0] : null,
                        category: columnPath.length > 0 ? columnPath[0] : null,
                    };

                    if (!clickedField || (clickedField.dataField !== 'totalMaterial' && clickedField.dataField !== 'totalItem')) {
                        appNotification?.info?.('Drilldown is only available for "Total Material" and "Total Item" cells.', { duration: 5000 });
                        return;
                    }

                    const payload = {
                        purchaser: cellFilters.purchaser,
                        category: cellFilters.category,
                    };

                    let gridData = rawRows;
                    let options = null;
                    let drilldownEndpoint = null;
                    if (clickedField.dataField === 'totalMaterial') {
                        drilldownEndpoint = dashboard?.config?.endpoints?.materialsDrilldown;
                    }

                    if (clickedField.dataField === 'totalItem') {
                        drilldownEndpoint = dashboard?.config?.endpoints?.itemsDrilldown;
                    }

                    // If you have an API for drilldown, this will POST payload and use response data.
                    if (drilldownEndpoint) {
                        const loadingId = appLoading.show('Loading details...');
                        try {
                            const ctrl = Http.createAbortController('categoriesDrilldown');
                            const resp = await Http.post(drilldownEndpoint, payload, { signal: ctrl.signal });
                            if (resp && resp.success) {
                                gridData = Array.isArray(resp.data)
                                    ? resp.data
                                    : (resp.data ? [resp.data] : []);

                                if (clickedField.dataField === 'totalMaterial') {
                                    options = {
                                        columns: [
                                            { dataField: 'code', caption: 'Code', fixed: true, fixedPosition: 'left', minWidth: 120 },
                                            { dataField: 'description', caption: 'Description' },
                                            { dataField: 'categoryCode', caption: 'Category Code' },
                                            { dataField: 'materialTypeCode', caption: 'Material Type Code' },
                                            { dataField: 'unit', caption: 'Unit' },
                                            { dataField: 'unitPrice', caption: 'Unit Price', format: { type: 'fixedPoint', precision: 4 } },
                                            { dataField: 'minimumOrder', caption: 'Minimum Order' },
                                            { dataField: 'costCenter', caption: 'Cost Center' },
                                            { dataField: 'stockControl', caption: 'Stock Control' },
                                        ]
                                    };
                                }

                                if (clickedField.dataField === 'totalItem') {
                                    const groupOfGoodsStore = await Shared.getGroupOfGoodsLookupStore();

                                    options = {
                                        columns: [
                                            { dataField: 'code', caption: 'Item Code', fixed: true, fixedPosition: 'left', minWidth: 180 },
                                            { dataField: 'description', caption: 'Description', minWidth: 200 },
                                            { dataField: 'unit', caption: 'Unit' },
                                            { dataField: 'unitPrice', caption: 'Unit Price', format: { type: 'fixedPoint', precision: 4 } },
                                            { dataField: 'currency', caption: 'Currency' },
                                            { dataField: 'conversionRate', caption: 'Conversion Rate', format: { type: 'fixedPoint', precision: 4 } },
                                            { dataField: 'moq', caption: 'MOQ' },
                                            { dataField: 'lotSize', caption: 'Lot Size' },
                                            { dataField: 'leadTime', caption: 'Lead Time (Days)' },
                                            { dataField: 'supplierCode', caption: 'Supplier Code' },
                                            { dataField: 'supplierName', caption: 'Supplier Name', minWidth: 200 },
                                            { dataField: 'quotationEffectiveDate', caption: 'Quotation Effective Date', dataType: 'datetime', format: 'dd/MM/yyyy HH:mm' },
                                            { dataField: 'quotationExpiryDate', caption: 'Quotation Expiry Date', dataType: 'datetime', format: 'dd/MM/yyyy HH:mm' },
                                            { dataField: 'quotationUrl', caption: 'Quotation Ref.' },
                                            {
                                                dataField: 'groupOfGoods',
                                                caption: 'Group of Goods',
                                                lookup: groupOfGoodsStore ? {
                                                    dataSource: groupOfGoodsStore,
                                                    valueExpr: 'id',
                                                    displayExpr: 'displayName'
                                                } : undefined
                                            },
                                        ]
                                    };
                                }

                                options = {
                                    columns: [
                                        ...options?.columns,
                                        { dataField: 'createdBy', caption: 'Created By' },
                                        { dataField: 'createdAt', caption: 'Created At', dataType: 'datetime', format: 'dd/MM/yyyy HH:mm' },
                                        { dataField: 'updatedBy', caption: 'Updated By' },
                                        { dataField: 'updatedAt', caption: 'Updated At', dataType: 'datetime', format: 'dd/MM/yyyy HH:mm' },
                                    ] || []
                                }
                            } else {
                                appNotification?.error?.(resp?.message || 'Failed to load drilldown data.', { duration: 5000 });
                            }
                        } catch (err) {
                            if (err && err.name === 'AbortError') return;
                            console.error(err);
                            appNotification?.error?.('Failed to load drilldown data. Please try again later.', { duration: 5000 });
                        } finally {
                            appLoading.hide(loadingId);
                        }
                    }

                    Shared.showTypeCategoryDrilldownPopup(dashboard, {
                        titleParts: [cellFilters.purchaser, cellFilters.category, clickedField.caption].filter(Boolean),
                        data: gridData,
                        payload,
                        ...options
                    });
                });
            },
            onCellPrepared: (e) => onCellPrepared(e)
        }).dxPivotGrid('instance');

        dashboard.widgets.recentApplicationsDataGrid = $(dashboard.recentApplicationsGridEl).dxDataGrid({
            dataSource: [],
            showBorders: true,
            columnAutoWidth: true,
            hoverStateEnabled: true,
            paging: { enabled: false },
            scrolling: { mode: 'standard' },
            height: 'auto',
            columns: [
                { dataField: 'applicationNumber', caption: 'Application No', minWidth: 140 },
                { dataField: 'applicationType', caption: 'Type', minWidth: 160 },
                {
                    dataField: 'applicationStatus', caption: 'Status', minWidth: 120,
                    cellTemplate: (container, options) => {
                        const cfg = Shared.getStatusConfig(options.value);
                        $('<span>')
                            .addClass(`status-badge status-${cfg.class}`)
                            .text(cfg.label || options.value)
                            .appendTo(container);
                    }
                },
                { dataField: 'requestor', caption: 'Purchaser', minWidth: 110 },
                { dataField: 'createdAt', caption: 'Created', dataType: 'date', format: 'dd-MM-yyyy HH:mm', minWidth: 150 }
            ]
        }).dxDataGrid('instance');

        // Purchaser / Suppliers: render as bar chart (instead of DataGrid)
        Shared.initPurchaserSupplierDrilldownPopup(dashboard);

        const purchaserSupplierChartInstance = $(dashboard.purchaserSupplierDataGridEl).dxChart({
            dataSource: [],
            palette: 'soft',
            rotated: true,
            commonSeriesSettings: {
                argumentField: 'purchaser',
                type: 'bar'
            },
            series: [
                { valueField: 'supplierCount', name: 'Suppliers' }
            ],
            commonSeriesSettings: {
                argumentField: 'purchaser',
                type: 'bar',
                label: {
                    visible: true,
                    position: 'outside',
                    font: { color: '#262626', size: 12, weight: 600 },
                    customizeText: function (arg) {
                        return Shared.formatNumber(arg.value);
                    }
                }
            },
            legend: {
                visible: false,
            },
            tooltip: {
                enabled: true,
                customizeTooltip(arg) {
                    return { text: `${arg.argumentText} : ${Shared.formatNumber(arg.value)} suppliers` };
                }
            },
            argumentAxis: {
                label: {
                    font: { color: '#595959' },
                    overlappingBehavior: 'stagger'
                },
                grid: { visible: false }
            },
            // zoomAndPan: {
            //     argumentAxis: 'both',         // 'zoom', 'pan', 'both'
            //     allowMouseWheel: true,
            //     allowTouchGestures: true
            // },
            valueAxis: {
                allowDecimals: false,
                label: { font: { color: '#595959' } },
                grid: { color: '#f0f0f0', opacity: 0.3 }
            },
            onPointHoverChanged: function (e) {
                const host = dashboard?.purchaserSupplierDataGridEl;
                if (!host) return;

                host.style.cursor = e.target.isHovered() ? 'pointer' : 'default';
            },
            onPointClick: function (e) {
                const point = e?.target;
                const row = point?.data || null;
                if (!row) return;
                Shared.showPurchaserSupplierDrilldownPopup(dashboard, row);
            }
        }).dxChart('instance');

        // Keep the old widget name so existing code can still call `.option('dataSource', ...)`.
        dashboard.widgets.purchaserSupplierChart = purchaserSupplierChartInstance;
        dashboard.widgets.purchaserSupplierDataGrid = purchaserSupplierChartInstance;
    };

    Shared._ensurePurchaserSupplierPopupDom = function _ensurePurchaserSupplierPopupDom() {
        const popupId = 'report-purchaser-supplier-popup';
        const gridId = 'report-purchaser-supplier-popup-grid';

        let popupEl = document.getElementById(popupId);
        let gridEl = document.getElementById(gridId);

        if (!popupEl) {
            popupEl = document.createElement('div');
            popupEl.id = popupId;
            document.body.appendChild(popupEl);
        }

        if (!gridEl) {
            gridEl = document.createElement('div');
            gridEl.id = gridId;
            popupEl.appendChild(gridEl);
        }

        return { popupEl, gridEl };
    };

    Shared.initPurchaserSupplierDrilldownPopup = function initPurchaserSupplierDrilldownPopup(dashboard) {
        if (!Shared.ensureDx()) return;
        if (!dashboard.widgets) dashboard.widgets = {};

        const { popupEl, gridEl } = Shared._ensurePurchaserSupplierPopupDom();

        if (!dashboard.widgets.purchaserSupplierDrilldownDataGrid) {
            dashboard.widgets.purchaserSupplierDrilldownDataGrid = $(gridEl).dxDataGrid({
                ...Shared.getDefaultDrillGridConfig,
                columns: []
            }).dxDataGrid('instance');
        }

        if (!dashboard.widgets.purchaserSupplierDrilldownPopup) {
            dashboard.widgets.purchaserSupplierDrilldownPopup = $(popupEl).dxPopup({
                ...Shared.getDefaultDrillGridPopupConfig('Purchaser / Suppliers'),
                contentTemplate: () => $(gridEl)
            }).dxPopup('instance');
        }
    };

    Shared.showPurchaserSupplierDrilldownPopup = async function showPurchaserSupplierDrilldownPopup(dashboard, row) {
        Shared.initPurchaserSupplierDrilldownPopup(dashboard);

        const popup = dashboard.widgets?.purchaserSupplierDrilldownPopup;
        const grid = dashboard.widgets?.purchaserSupplierDrilldownDataGrid;

        if (!popup || !grid) return;

        const purchaser = (row?.purchaser ?? row?.Purchaser ?? '').toString();
        const supplierCount = Number(row?.supplierCount ?? row?.SupplierCount ?? 0) || 0;
        const title = purchaser ? `Purchaser / Suppliers: ${purchaser}` : 'Purchaser / Suppliers';
        popup.option('title', title);

        // Drilldown API (preferred): load details on click and show in grid.
        const drilldownEndpoint = dashboard?.config?.endpoints?.supplierPurchaserDrilldown;

        if (drilldownEndpoint) {
            const loadingId = appLoading.show('Loading details...');
            try {
                const ctrl = Http.createAbortController('supplierPurchaserDrilldown');
                const payload = { purchaser };
                const resp = await Http.post(drilldownEndpoint, payload, { signal: ctrl.signal });

                if (resp && resp.success) {
                    const gridData = Array.isArray(resp.data)
                        ? resp.data
                        : (resp.data ? [resp.data] : []);

                    const columns = [
                        {
                            dataField: 'code',
                            caption: 'Code',
                            width: 120,
                        },
                        {
                            dataField: 'name',
                            caption: 'Name',
                            minWidth: 150,
                        },
                        {
                            dataField: 'purchaserNames',
                            caption: 'Purchasers',
                        },
                        {
                            dataField: 'isActive',
                            caption: 'Active',
                            width: 80,
                            alignment: 'center',
                            dataType: 'boolean',
                        },
                        { dataField: 'createdBy', caption: 'Created By' },
                        { dataField: 'createdAt', caption: 'Created At', dataType: 'datetime', format: 'dd/MM/yyyy HH:mm' },
                    ];
                    if (columns.length) {
                        grid.option('columns', columns);
                    }
                    grid.option('dataSource', gridData);

                    dashboard._lastPurchaserSupplierDrilldownPayload = payload;
                    popup.show();
                    return;
                }

                appNotification?.error?.(resp?.message || 'Failed to load drilldown data.', { duration: 5000 });
            } catch (err) {
                if (err && err.name === 'AbortError') return;
                console.error(err);
                appNotification?.error?.('Failed to load drilldown data. Please try again later.', { duration: 5000 });
            } finally {
                appLoading.hide(loadingId);
            }
        }

        // Fallback: show just the clicked summary row.
        grid.option('columns', [
            { dataField: 'purchaser', caption: 'Purchaser', minWidth: 180 },
            { dataField: 'supplierCount', caption: 'Suppliers', dataType: 'number', minWidth: 100 }
        ]);
        grid.option('dataSource', [{ purchaser, supplierCount }]);

        // Keep for debugging
        dashboard._lastPurchaserSupplierClicked = row;
        popup.show();
    };

    Shared.getDefaultDrillGridConfig = {
        dataSource: [],
        showBorders: true,
        columnAutoWidth: true,
        rowAlternationEnabled: true,
        hoverStateEnabled: true,
        dragEnabled: false,
        height: '100%',
        scrolling: { mode: 'standard' },
        paging: { pageSize: 20 },
        pager: { visible: true, showInfo: true, showPageSizeSelector: true, allowedPageSizes: [20, 50, 100] },
        filterRow: { visible: true },
        headerFilter: { visible: true },
        searchPanel: { visible: true, width: 240 },
    }

    Shared.getDefaultDrillGridPopupConfig = (title) => {
        return {
            visible: false,
            showTitle: true,
            title: title || 'Applications (Drilldown)',
            dragEnabled: false,
            resizeEnabled: true,
            closeOnOutsideClick: true,
            showCloseButton: true,
            width: '90vw',
            height: '80vh',
        };
    }

    Shared.initTypePurchaserDrilldownPopup = function initTypePurchaserDrilldownPopup(dashboard) {
        const popupEl = document.getElementById('report-typepurchaser-drilldown-popup');
        const gridEl = document.getElementById('report-typepurchaser-drilldown-grid');

        if (!popupEl || !gridEl) return;
        if (!Shared.ensureDx()) return;

        if (!dashboard.widgets) dashboard.widgets = {};

        if (!dashboard.widgets.typePurchaserDrilldownDataGrid) {
            dashboard.widgets.typePurchaserDrilldownDataGrid = $(gridEl).dxDataGrid({
                ...Shared.getDefaultDrillGridConfig
            }).dxDataGrid('instance');
        }

        if (!dashboard.widgets.typePurchaserDrilldownPopup) {
            dashboard.widgets.typePurchaserDrilldownPopup = $(popupEl).dxPopup({
                ...Shared.getDefaultDrillGridPopupConfig(),
                contentTemplate: () => $(gridEl)
            }).dxPopup('instance');
        }
    };

    Shared.getStatusConfig = function getStatusConfig(status) {
        const s = String(status || '').toLowerCase();
        return Shared.STATUS_CONFIG[s] || { class: 'default', label: status };
    }

    Shared.STATUS_CONFIG = {
        draft: { class: 'draft', label: 'Draft' },
        returned: { class: 'returned', label: 'Returned' },
        verified: { class: 'verified', label: 'Verified' },
        approved: { class: 'approved', label: 'Approved' },
        completed: { class: 'completed', label: 'Completed' },
        cancelled: { class: 'cancelled', label: 'Cancelled' },
        waitingEffective: { class: 'waiting-effective', label: 'Waiting Effective' },
    }

    Shared.showTypePurchaserDrilldownPopup = function showTypePurchaserDrilldownPopup(dashboard, options) {
        Shared.initTypePurchaserDrilldownPopup(dashboard);

        const popup = dashboard.widgets?.typePurchaserDrilldownPopup;
        const grid = dashboard.widgets?.typePurchaserDrilldownDataGrid;

        if (!popup || !grid) {
            console.warn('Drilldown popup not initialized (missing DOM elements).');
            return;
        }

        const titleParts = Array.isArray(options?.titleParts) ? options.titleParts : [];
        const title = titleParts.length
            ? `Applications (Drilldown): ${titleParts.join(' / ')}`
            : 'Applications (Drilldown)';

        popup.option('title', title);

        const data = Array.isArray(options?.data) ? options.data : [];
        if (options?.columns) {
            grid.option("columns", options.columns);
        }
        grid.option('dataSource', data);

        // Keep payload available for debugging / later wiring
        dashboard._lastTypePurchaserDrilldownPayload = options?.payload || null;

        popup.show();
    };

    Shared.initTypeCategoryDrilldownPopup = function initTypeCategoryDrilldownPopup(dashboard) {
        const popupEl = document.getElementById('report-typecategory-drilldown-popup');
        const gridEl = document.getElementById('report-typecategory-drilldown-grid');

        if (!popupEl || !gridEl) return;
        if (!Shared.ensureDx()) return;

        if (!dashboard.widgets) dashboard.widgets = {};
        if (!dashboard.widgets.typeCategoryDrilldownDataGrid) {
            dashboard.widgets.typeCategoryDrilldownDataGrid = $(gridEl).dxDataGrid({
                ...Shared.getDefaultDrillGridConfig
            }).dxDataGrid('instance');
        }

        if (!dashboard.widgets.typeCategoryDrilldownPopup) {
            dashboard.widgets.typeCategoryDrilldownPopup = $(popupEl).dxPopup({
                ...Shared.getDefaultDrillGridPopupConfig('Category Drilldown'),
                contentTemplate: () => $(gridEl)
            }).dxPopup('instance');
        }
    };

    Shared.showTypeCategoryDrilldownPopup = function showTypeCategoryDrilldownPopup(dashboard, options) {
        Shared.initTypeCategoryDrilldownPopup(dashboard);

        const popup = dashboard.widgets?.typeCategoryDrilldownPopup;
        const grid = dashboard.widgets?.typeCategoryDrilldownDataGrid;

        if (!popup || !grid) {
            console.warn('Drilldown popup not initialized (missing DOM elements).');
            return;
        }

        const titleParts = Array.isArray(options?.titleParts) ? options.titleParts : [];
        const title = titleParts.length
            ? `Category (Drilldown): ${titleParts.join(' / ')}`
            : 'Category (Drilldown)';

        popup.option('title', title);

        const data = Array.isArray(options?.data) ? options.data : [];
        if (options?.columns) {
            grid.option("columns", options.columns);
        }
        grid.option('dataSource', data);

        // Keep payload available for debugging / later wiring
        dashboard._lastTypeCategoryDrilldownPayload = options?.payload || null;
        popup.show();
    }

    window.ReportDashboardShared = Shared;

})(window);
