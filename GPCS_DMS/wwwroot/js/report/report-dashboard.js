(function () {
    'use strict';

    function ensureDx() {
        if (!window.DevExpress || !DevExpress.ui) {
            console.error('DevExtreme not found. Ensure dx.all.js is loaded.');
            return false;
        }
        return true;
    }

    function getConfig() {
        const cfg = window.ReportDashboardConfig || {};
        const endpoints = cfg.endpoints || {};
        return {
            endpoints: {
                dashboard: endpoints.dashboard || 'dashboard',
                applications: endpoints.applications || 'dashboard/applications',
                monitoring: endpoints.monitoring || 'dashboard/monitoring',
                masterData: endpoints.masterData || 'dashboard/masterdata',
            }
        };
    }

    function buildUrl(url, query) {
        const u = new URL(url,window.APP_CONFIG?.baseUrl || window.location.origin);
        const q = query || {};
        Object.keys(q).forEach(k => {
            const v = q[k];
            if (v === undefined || v === null || v === '') return;
            u.searchParams.set(k, String(v));
        });
        return u.toString();
    }

    function formatNumber(n) {
        const x = Number(n) || 0;
        return x.toLocaleString('en-US');
    }

    function toDate(value) {
        if (!value) return null;
        if (value instanceof Date) return value;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    function startOfDay(d) {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
    }

    function addDays(d, days) {
        const x = new Date(d);
        x.setDate(x.getDate() + days);
        return x;
    }

    function pad2(n) {
        return (n < 10 ? '0' : '') + n;
    }

    function formatYMD(d) {
        const x = new Date(d);
        return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
    }

    function monthKey(d) {
        const x = new Date(d);
        return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}`;
    }

    function defaultRangeForPeriod(period) {
        const now = new Date();
        if (period === 'daily') return { start: addDays(now, -13), end: now };
        if (period === 'weekly') return { start: addDays(now, -7 * 11), end: now };
        if (period === 'monthly') return { start: addDays(now, -30 * 11), end: now };
        if (period === 'yearly') return { start: addDays(now, -365 * 4), end: now };
        // range
        return { start: addDays(now, -13), end: now };
    }

    function renderKpiStrip(container, items) {
        if (!container) return;
        const list = Array.isArray(items) ? items : [];
        container.innerHTML = list.map(x => `
            <div class="report-kpi-item">
                <div class="report-kpi-label">${x.label}</div>
                <div class="report-kpi-value">${formatNumber(x.value)}</div>
                ${x.hint ? `<div class="report-kpi-hint">${x.hint}</div>` : ''}
            </div>
        `).join('');
    }

    function asDomElement(el) {
        if (!el) return null;
        if (el.nodeType) return el;
        // jQuery / DevExtreme renderer wrappers
        if (typeof el.get === 'function') return el.get(0);
        if (el[0] && el[0].nodeType) return el[0];
        return null;
    }

    class ReportDashboard {
        constructor() {
            this.config = getConfig();

            this.periodEl = document.getElementById('report-period');
            this.dateRangeWrapper = document.getElementById('report-date-range-wrapper');
            this.dateRangeEl = document.getElementById('report-date-range');
            this.refreshBtn = document.getElementById('report-refresh-btn');

            this.appCardEl = document.getElementById('report-app-card');

            this.appKpiEl = document.getElementById('report-app-kpi');
            this.dataKpiEl = document.getElementById('report-data-kpi');
            this.purchaserSupplierGridEl = document.getElementById('report-purchaser-supplier-grid');

            this.createdChartEl = document.getElementById('report-app-created-chart');
            this.statusPieEl = document.getElementById('report-app-status-pie');
            this.typePurchaserGridEl = document.getElementById('report-app-type-purchaser-grid');

            this.userTypeCategoryGridEl = document.getElementById('report-data-usertype-category-grid');

            this.calendarEl = document.getElementById('report-calendar');
            this.calendarEventsEl = document.getElementById('report-calendar-events');
            this.recentGridEl = document.getElementById('report-recent-app-grid');
            this.exchangeListEl = document.getElementById('report-exchange-rate-list');

            this.period = 'daily';
            const range = defaultRangeForPeriod(this.period);
            this.startDate = startOfDay(range.start);
            this.endDate = range.end;

            this.widgets = {
                period: null,
                dateRange: null,
                createdChart: null,
                statusPie: null,
                typePurchaserGrid: null,
                userTypeCategoryGrid: null,
                purchaserSupplierGrid: null,
                calendar: null,
                recentGrid: null
            };

            this._calendarEventMap = new Map();
            this._calendarEvents = [];

            this._abort = {
                dashboard: null,
                applications: null
            };
        }

        async init() {
            if (!ensureDx()) return;
            try {
                this.initFilters();
                this.initStaticWidgets();
                this.bindEvents();
                this.refresh();
            } finally {

            }
        }

        initFilters() {
            const items = [
                { id: 'daily', text: 'Daily' },
                { id: 'weekly', text: 'Weekly' },
                { id: 'monthly', text: 'Monthly' },
                { id: 'yearly', text: 'Yearly' },
                { id: 'range', text: 'Range' }
            ];

            this.widgets.period = $(this.periodEl).dxSelectBox({
                items,
                valueExpr: 'id',
                displayExpr: 'text',
                value: this.period,
                width: 210,
                onValueChanged: (e) => {
                    this.period = e.value || 'daily';
                    const showRange = this.period === 'range';
                    if (this.dateRangeWrapper) this.dateRangeWrapper.style.display = showRange ? '' : 'none';

                    if (!showRange) {
                        const range = defaultRangeForPeriod(this.period);
                        this.startDate = startOfDay(range.start);
                        this.endDate = range.end;
                        if (this.widgets.dateRange) this.widgets.dateRange.option('value', [this.startDate, this.endDate]);
                    }

                    // Only reload Applications section when filters change
                    this.refreshApplications();
                }
            }).dxSelectBox('instance');

            this.widgets.dateRange = $(this.dateRangeEl).dxDateRangeBox({
                value: [this.startDate, this.endDate],
                width: 320,
                displayFormat: 'dd-MM-yyyy',
                startDatePlaceholder: 'Start',
                endDatePlaceholder: 'End',
                showClearButton: false,
                labelMode: 'hidden',
                onValueChanged: (e) => {
                    if (this.period !== 'range') return;
                    const v = e.value || [];
                    const s = toDate(v[0]);
                    const en = toDate(v[1]);
                    if (s && en) {
                        this.startDate = startOfDay(s);
                        this.endDate = en;
                        // Only reload Applications section when filters change
                        this.refreshApplications();
                    }
                }
            }).dxDateRangeBox('instance');

            // initial visibility
            if (this.dateRangeWrapper) this.dateRangeWrapper.style.display = this.period === 'range' ? '' : 'none';
        }

        initStaticWidgets() {
            const self = this;
            this.widgets.calendar = $(this.calendarEl).dxCalendar({
                value: new Date(),
                firstDayOfWeek: 1,
                showTodayButton: true,
                height: '100%',
                cellTemplate: function (cellData, cellIndex, cellElement) {
                    // cellData: { date, text, view }
                    const date = cellData?.date;
                    const text = cellData?.text;
                    const key = date ? formatYMD(date) : '';
                    const events = key ? self._calendarEventMap.get(key) : null;

                    const host = asDomElement(cellElement);
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

            this.widgets.createdChart = $(this.createdChartEl).dxChart({
                dataSource: [],
                palette: 'Soft',
                commonSeriesSettings: {
                    argumentField: 'bucket',
                    type: 'line',
                    point: { visible: false }
                },
                series: [{ valueField: 'count', name: 'Applications' }],
                tooltip: { enabled: true },
                legend: { visible: false },
                argumentAxis: {
                    label: { overlappingBehavior: 'rotate', rotationAngle: 45 }
                },
                valueAxis: { allowDecimals: false }
            }).dxChart('instance');

            this.widgets.statusPie = $(this.statusPieEl).dxPieChart({
                dataSource: [],
                palette: 'Soft',
                series: [{ argumentField: 'status', valueField: 'count', label: { visible: true, connector: { visible: true } } }],
                legend: { horizontalAlignment: 'center', verticalAlignment: 'bottom' },
                tooltip: { enabled: true }
            }).dxPieChart('instance');

            this.widgets.typePurchaserGrid = $(this.typePurchaserGridEl).dxPivotGrid({
                dataSource: {
                    fields:[
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
                    store:[]
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
                    grandTotal: "Total All",    
                    total: "Sub Total"               
                },
                onCellClick: function (e) {

                    if (e.area !== "data") return;

                    const pivot = e.component;

                    const drillDownDataSource =
                        pivot.getDataSource().createDrillDownDataSource(e.cell);

                    drillDownDataSource.load().done(function (data) {

                        console.log("Raw records in this cell:", data);

                        // Get Query params and dataRow to Filter the Applications list
                    });
                },
                onCellPrepared: function (e) {
                    if (e.area === "data") {

                        e.cellElement.css("cursor", "pointer");

                        // Hover in
                        e.cellElement.on("mouseenter", function () {
                            $(this).css("background-color", "#e6f2ff");
                        });

                        // Hover out
                        e.cellElement.on("mouseleave", function () {
                            $(this).css("background-color", "");
                        });

                    }
                }
            }).dxPivotGrid('instance');

            this.widgets.userTypeCategoryGrid = $(this.userTypeCategoryGridEl).dxPivotGrid({
                dataSource: {
                    fields:[
                        {
                            caption:'Purchaser',
                            dataField:'purchaser',
                            area:'row',
                            headerFilter: {
                                search: {
                                enabled: true,
                                },
                            },
                        },
                        {
                            caption:'Category',
                            dataField:'category',
                            area:'column',
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
                    store:[]
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
                    grandTotal: "Total All",    
                    total: "Sub Total"               
                },
            }).dxPivotGrid('instance');

            this.widgets.recentGrid = $(this.recentGridEl).dxDataGrid({
                dataSource: [],
                showBorders: true,
                columnAutoWidth: true,
                rowAlternationEnabled: true,
                paging: { enabled: false },
                scrolling: { mode: 'standard' },
                columns: [
                    { dataField: 'applicationNumber', caption: 'Application No', minWidth: 140 },
                    { dataField: 'applicationType', caption: 'Type', minWidth: 160 },
                    { dataField: 'applicationStatus', caption: 'Status', minWidth: 120 },
                    { dataField: 'requestor', caption: 'Purchaser', minWidth: 110 },
                    { dataField: 'createdAt', caption: 'Created', dataType: 'date', format: 'dd-MM-yyyy HH:mm', minWidth: 150 }
                ]
            }).dxDataGrid('instance');

            this.widgets.purchaserSupplierGrid = $(this.purchaserSupplierGridEl).dxDataGrid({
                dataSource: [],
                showBorders: true,
                columnAutoWidth: true,
                rowAlternationEnabled: true,
                hoverStateEnabled: true,
                paging: { enabled: false },
                columns: [
                    { dataField: 'purchaser', caption: 'Purchaser',  },
                    { dataField: 'supplierCount', caption: 'Suppliers', dataType: 'number', minWidth: 50}
                ]
            }).dxDataGrid('instance');
        }

        bindEvents() {
            if (this.refreshBtn) {
                this.refreshBtn.addEventListener('click', () => this.refresh());
            }
        }

        getQueryParams() {
            return {
                period: this.period,
                startDate: this.startDate ? formatYMD(this.startDate) : null,
                endDate: this.endDate ? formatYMD(this.endDate) : null
            };
        }

        async loadDashboard() {
            const ctrl = Http.createAbortController('dashboard');

            const url = buildUrl(
                this.config.endpoints.dashboard,
                this.getQueryParams()
            );

            const payload = await Http.get(url, {
                signal: ctrl.signal
            });

            const result = payload && payload.data ? payload.data : null;

            return {
                application: result ? result.application : null,
                monitoring: result ? result.monitoring : null,
                masterData: result ? result.masterData : null
            }
        }

        async loadApplications() {
            const ctrl = Http.createAbortController('applications');
            const url = buildUrl(
                this.config.endpoints.applications,
                this.getQueryParams()
            );

            const payload = await Http.get(url, {
                signal: ctrl.signal
            });

            if(!payload || !payload.success){
                appNotification.error('Failed to load applications data. Please try again later.', { duration: 5000 });
            }

            return payload && payload.data ? payload.data : null;
        }

        async loadMonitoring() {
            const ctrl = Http.createAbortController('monitoring');
            const url = this.config.endpoints.monitoring;
            const payload = await Http.get(url, {
                signal: ctrl.signal
            });

            if(!payload || !payload.success){
                appNotification.error('Failed to load data monitoring info. Please try again later.', { duration: 5000 });
            }

            return payload && payload.data ? payload.data : null;
        }

        async loadMasterData() {
            const ctrl = Http.createAbortController('masterdata');
            const url = this.config.endpoints.masterData;
            const payload = await Http.get(url, {
                signal: ctrl.signal
            });

            if(!payload || !payload.success){
                appNotification.error('Failed to load master data info. Please try again later.', { duration: 5000 });
            }
            return payload && payload.data ? payload.data : null;
        }

        async refreshApplications() {
            const loadingId = appLoading.showOn(this.appCardEl, { text: 'Loading applications...' });
            try {
                const result = await this.loadApplications();
                if(!result){
                    appNotification.error('No data received for applications. Please try again later.', { duration: 5000 });
                }
                this.renderApplications(result);
            } catch (err) {
                if (err && err.name === 'AbortError') return;
                console.error(err);
            } finally {
                appLoading.hideOn(loadingId);
            }
        }

        async refresh() {
            try {
                const payload = await this.loadDashboard();
                console.log('Dashboard payload:', payload);
                this.renderApplications(payload.application);
                this.renderDataMonitoring(payload.monitoring);
                this.renderMasterData(payload.masterData);
            } catch (err) {
                if (err && err.name === 'AbortError') return;
                console.error(err);
            }
        }

        renderApplications(app) {
            renderKpiStrip(this.appKpiEl, [
                { label: 'Total Applications', value: app.summary.total, hint: 'All statuses' },
                { label: 'In Process', value: app.summary.inProcess, hint: 'Working on it' },
                { label: 'Completed', value: app.summary.completed, hint: 'Done' },
                { label: 'Waiting Effective', value: app.summary.waitingEffective, hint: 'Pending' }
            ]);

            if (this.widgets.createdChart) this.widgets.createdChart.option('dataSource', app.createdSeries);
            if (this.widgets.statusPie) this.widgets.statusPie.option('dataSource', app.statusDistribution);

            // Transform type-purchaser data to pivot grid format
            if (this.widgets.typePurchaserGrid) {
                this.widgets.typePurchaserGrid.option('dataSource.store', app.purchaserTypeCounts
                    || []);
            }
        }

        renderDataMonitoring(dm) {
            renderKpiStrip(this.dataKpiEl, [
                { label: 'Total Material', value: dm.summary.totalMaterial, hint: 'Records' },
                { label: 'Total Item', value: dm.summary.totalItem, hint: 'Records' },
                { label: 'Quotation Expire', value: dm.summary.quotationExpire, hint: 'Items' },
                { label: 'Need Action (< 45 days)', value: dm.summary.needAction, hint: 'Items' }
            ]);

            if (this.widgets.userTypeCategoryGrid) {
                this.widgets.userTypeCategoryGrid.option('dataSource.store', dm.purchaserCategories || []);
            }
        }

        renderMasterData(md) {
            if (this.widgets.purchaserSupplierGrid) {
                this.widgets.purchaserSupplierGrid.option('dataSource', md.purchaserSupplierCounts || []);
            }

            if (this.widgets.recentGrid) this.widgets.recentGrid.option('dataSource', md.recentApplications|| []);
            this.setCalendarEvents(md.calendars || []);
            this.renderCalendarEvents(this.widgets.calendar?.option('value') || new Date());

            this.renderExchangeRates(md.exchangeRate || []);
        }

        setCalendarEvents(events) {
            this._calendarEvents = Array.isArray(events) ? events : [];
            this._calendarEventMap = new Map();

            for (const ev of this._calendarEvents) {
                const d = toDate(ev.date);
                if (!d) continue;
                const key = formatYMD(d);
                if (!this._calendarEventMap.has(key)) this._calendarEventMap.set(key, []);
                this._calendarEventMap.get(key).push({
                    date: d,
                    type: (ev.type || '').toString(),
                    title: (ev.title || '').toString(),
                    note: (ev.note || '').toString()
                });
            }

            // Refresh calendar rendering (cellTemplate reads from the map)
            try {
                this.widgets.calendar?.repaint();
            } catch {
                // ignore
            }
        }

        renderCalendarEvents(date) {
            if (!this.calendarEventsEl) return;
            const d = toDate(date) || new Date();
            const key = formatYMD(d);
            const list = this._calendarEventMap.get(key) || [];

            const title = `Selected: ${key}`;

            if (!list.length) {
                this.calendarEventsEl.innerHTML = `
                    <div class="report-calendar-events-title">${title}</div>
                    <div class="report-calendar-event">
                        <span class="report-calendar-badge">Info</span>
                        <div>
                            <p class="report-calendar-event-title">No events</p>
                            <p class="report-calendar-event-note">No special schedule for this date.</p>
                        </div>
                    </div>
                `;
                return;
            }

            const badgeClass = (type) => {
                if (type === 'holiday') return 'report-calendar-badge--holiday';
                if (type === 'inventory') return 'report-calendar-badge--inventory';
                if (type === 'monthClose') return 'report-calendar-badge--monthClose';
                return '';
            };

            const badgeText = (type) => {
                if (type === 'holiday') return 'Holiday';
                if (type === 'inventory') return 'Inventory';
                if (type === 'monthClose') return 'Close';
                return (type || 'Info');
            };

            this.calendarEventsEl.innerHTML = `
                <div class="report-calendar-events-title">${title}</div>
                ${list.map(ev => `
                    <div class="report-calendar-event">
                        <span class="report-calendar-badge ${badgeClass(ev.type)}">${badgeText(ev.type)}</span>
                        <div>
                            <p class="report-calendar-event-title">${ev.title}</p>
                            ${ev.note ? `<p class="report-calendar-event-note">${ev.note}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            `;
        }

        renderExchangeRates(rates) {
            if (!this.exchangeListEl) return;
            const list = Array.isArray(rates) ? rates : [];
            const now = new Date();
            const key = monthKey(now);
            const storageKey = `report.exchangeRates.${key}`;

            let baseline = null;
            try {
                baseline = JSON.parse(localStorage.getItem(storageKey) || 'null');
            } catch {
                baseline = null;
            }

            if (!baseline || typeof baseline !== 'object') {
                baseline = {};
                for (const r of list) baseline[r.currency] = Number(r.rate);
                try {
                    localStorage.setItem(storageKey, JSON.stringify(baseline));
                } catch {
                    // ignore
                }
            }

            const fmtRate = (n) => (Number(n) || 0).toFixed(4);
            const fmtDelta = (d) => {
                const sign = d > 0 ? '+' : '';
                return sign + d.toFixed(4);
            };

            const rows = list.map(r => {
                const cur = r.currency;
                const rate = Number(r.rate) || 0;
                const base = Number(baseline[cur]);

                let delta = null;
                if (!Number.isNaN(base) && base !== 0) delta = rate - base;

                let deltaClass = 'report-ex-rate-delta--flat';
                let deltaText = '±0.0000';

                if (delta === null || Number.isNaN(delta)) {
                    deltaText = '';
                } else if (Math.abs(delta) < 0.00005) {
                    deltaText = '±0.0000';
                } else if (delta > 0) {
                    deltaClass = 'report-ex-rate-delta--up';
                    deltaText = `▲ ${fmtDelta(delta)}`;
                } else {
                    deltaClass = 'report-ex-rate-delta--down';
                    deltaText = `▼ ${fmtDelta(delta)}`;
                }

                return `
                    <div class="report-ex-rate-item">
                        <div>
                            <div class="report-ex-rate-code">${cur}</div>
                            <div class="report-ex-rate-value">${fmtRate(rate)}</div>
                        </div>
                        <div>
                            <div class="report-ex-rate-delta ${deltaClass}">${deltaText}</div>
                        </div>
                    </div>
                `;
            }).join('');

            this.exchangeListEl.innerHTML = rows || '<div class="text-muted">No data</div>';
        }
    }

    $(function () {
        const dashboard = new ReportDashboard();
        dashboard.init();
    });
})();
