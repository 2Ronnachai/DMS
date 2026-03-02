(function () {
    'use strict';

    const Shared = window.ReportDashboardShared;
    if (!Shared) {
        console.error('ReportDashboardShared not found. Ensure report-dashboard.shared.js is loaded BEFORE report-dashboard.js');
        return;
    }

    class ReportDashboard {
        constructor() {
            this.config = Shared.getConfig();

            this.periodEl = document.getElementById('report-period');
            this.dateRangeWrapper = document.getElementById('report-date-range-wrapper');
            this.dateRangeEl = document.getElementById('report-date-range');
            this.refreshBtn = document.getElementById('report-refresh-btn');

            this.appCardEl = document.getElementById('report-app-card');

            this.appKpiEl = document.getElementById('report-app-kpi');
            this.dataKpiEl = document.getElementById('report-data-kpi');
            this.purchaserSupplierDataGridEl = document.getElementById('report-purchaser-supplier-grid');

            this.createdChartEl = document.getElementById('report-app-created-chart');
            this.statusPieEl = document.getElementById('report-app-status-pie');
            this.typePurchaserPivotGridEl = document.getElementById('report-app-type-purchaser-grid');

            this.userTypeCategoryPivotGridEl = document.getElementById('report-data-usertype-category-grid');

            this.calendarEl = document.getElementById('report-calendar');
            this.calendarEventsEl = document.getElementById('report-calendar-events');
            this.recentApplicationsGridEl = document.getElementById('report-recent-app-grid');
            this.exchangeListEl = document.getElementById('report-exchange-rate-list');

            this.period = 'daily';
            const range = Shared.defaultRangeForPeriod(this.period);
            this.startDate = Shared.startOfDay(range.start);
            this.endDate = range.end;

            this.widgets = {
                periodSelectBox: null,
                dateRangeBox: null,
                createdApplicationsChart: null,
                applicationStatusPieChart: null,
                typePurchaserPivotGrid: null,
                userTypeCategoryPivotGrid: null,
                purchaserSupplierDataGrid: null,
                purchaserSupplierChart: null,
                calendar: null,
                recentApplicationsDataGrid: null,
                typePurchaserDrilldownDataGrid: null,
                typePurchaserDrilldownPopup: null,
                typeCategoryDrilldownDataGrid: null,
                typeCategoryDrilldownPopup: null,
                purchaserSupplierDrilldownDataGrid: null,
                purchaserSupplierDrilldownPopup: null
            };

            this._calendarEventMap = new Map();
            this._calendarEvents = [];
        }

        async init() {
            if (!Shared.ensureDx()) return;
            try {
                this.initFilters();
                this.initStaticWidgets();
                this.bindEvents();
                this.refresh();
            } finally {

            }
        }

        initFilters() {
            Shared.initFilterWidgets(this);
        }

        initStaticWidgets() {
            Shared.initStaticWidgets(this);
        }

        bindEvents() {
            if (this.refreshBtn) {
                this.refreshBtn.addEventListener('click', () => this.refresh());
            }
        }

        getQueryParams() {
            return {
                period: this.period,
                startDate: this.startDate ? Shared.formatYMD(this.startDate) : null,
                endDate: this.endDate ? Shared.formatYMD(this.endDate) : null
            };
        }

        async loadDashboard() {
            const loadingId = appLoading.show('Loading dashboard...');
            try {
                const ctrl = Http.createAbortController('dashboard');

                const url = Shared.buildUrl(
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
            } finally {
                appLoading.hide(loadingId);
            }
        }

        async loadApplications() {
            const ctrl = Http.createAbortController('applications');
            const url = Shared.buildUrl(
                this.config.endpoints.applications,
                this.getQueryParams()
            );

            const payload = await Http.get(url, {
                signal: ctrl.signal
            });

            if (!payload || !payload.success) {
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

            if (!payload || !payload.success) {
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

            if (!payload || !payload.success) {
                appNotification.error('Failed to load master data info. Please try again later.', { duration: 5000 });
            }
            return payload && payload.data ? payload.data : null;
        }

        async refreshApplications() {
            const loadingId = appLoading.showOn(this.appCardEl, { text: 'Loading applications...' });
            try {
                const result = await this.loadApplications();
                if (!result) {
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
            Shared.renderKpiStrip(this.appKpiEl, [
                { label: 'Total Applications', value: app.summary.total, hint: 'All statuses' },
                { label: 'In Process', value: app.summary.inProcess, hint: 'Working on it' },
                { label: 'Completed', value: app.summary.completed, hint: 'Done' },
                { label: 'Waiting Effective', value: app.summary.waitingEffective, hint: 'Pending' }
            ]);

            if (this.widgets.createdApplicationsChart) this.widgets.createdApplicationsChart.option('dataSource', app.createdSeries);
            if (this.widgets.applicationStatusPieChart) this.widgets.applicationStatusPieChart.option('dataSource', app.statusDistribution);

            // Transform type-purchaser data to pivot grid format
            if (this.widgets.typePurchaserPivotGrid) {
                this.widgets.typePurchaserPivotGrid.option('dataSource.store', app.purchaserTypeCounts
                    || []);
            }
        }

        renderDataMonitoring(dm) {
            Shared.renderKpiStrip(this.dataKpiEl, [
                { label: 'Total Material', value: dm.summary.totalMaterial, hint: 'Records' },
                { label: 'Total Item', value: dm.summary.totalItem, hint: 'Records' },
                { label: 'Quotation Expire', value: dm.summary.quotationExpire, hint: 'Items' },
                { label: 'Need Action (< 45 days)', value: dm.summary.needAction, hint: 'Items' }
            ]);

            if (this.widgets.userTypeCategoryPivotGrid) {
                this.widgets.userTypeCategoryPivotGrid.option('dataSource.store', dm.purchaserCategories || []);
            }
        }

        renderMasterData(md) {
            this._purchaserSupplierCounts = md?.purchaserSupplierCounts || [];
            if (this.widgets.purchaserSupplierDataGrid) {
                this.updatePurchaserSupplierChart(this, md.purchaserSupplierCounts || []);
            }

            if (this.widgets.recentApplicationsDataGrid) this.widgets.recentApplicationsDataGrid.option('dataSource', md.recentApplications || []);
            this.setCalendarEvents(md.calendars || []);
            this.renderCalendarEvents(this.widgets.calendar?.option('value') || new Date());

            this.renderExchangeRates(md.exchangeRates || []);
        }

        updatePurchaserSupplierChart(dashboard, rawData) {
            const data = (rawData || []).filter(d => d.supplierCount > 0);
            if (!data.length) {
                dashboard.widgets.purchaserSupplierChart.option('dataSource', []);
                return;
            }

            const values = data.map(d => d.supplierCount);
            const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
            const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

            function getCssVar(name, fallback) {
                try {
                    const v = getComputedStyle(document.documentElement).getPropertyValue(name);
                    const s = (v || '').trim();
                    return s || fallback;
                } catch {
                    return fallback;
                }
            }

            function hexToRgba(hex, alpha) {
                const h = (hex || '').trim();
                const m = /^#?([0-9a-fA-F]{6})$/.exec(h);
                if (!m) return hex;
                const n = parseInt(m[1], 16);
                const r = (n >> 16) & 255;
                const g = (n >> 8) & 255;
                const b = n & 255;
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }

            // Use the site's design tokens (see :root in site.css)
            const zoneColors = {
                low: getCssVar('--success-color', '#27AE60'),
                moderate: getCssVar('--accent-color', '#1890ff'),
                high: getCssVar('--warning-color', '#F39C12'),
                critical: getCssVar('--danger-color', '#E74C3C')
            };

            function getZoneColor(val) {
                // Slight transparency makes the colors feel less "blocky" without going dull.
                const alpha = 0.88;
                if (val >= mean + std * 1.5) return hexToRgba(zoneColors.critical, alpha);
                if (val >= mean + std * 0.5) return hexToRgba(zoneColors.high, alpha);
                if (val >= mean - std * 0.5) return hexToRgba(zoneColors.moderate, alpha);
                return hexToRgba(zoneColors.low, alpha);
            }

            function getZoneLabel(val) {
                if (val >= mean + std * 1.5) return 'Critical Load';
                if (val >= mean + std * 0.5) return 'High Load';
                if (val >= mean - std * 0.5) return 'Moderate Load';
                return 'Low Load';
            }

            dashboard.widgets.purchaserSupplierChart.option({
                dataSource: data,
                customizePoint: function (pointInfo) {
                    const color = getZoneColor(pointInfo.value);
                    return { color, hoverStyle: { color } };
                },
                tooltip: {
                    enabled: true,
                    customizeTooltip(arg) {
                        return {
                            // Keep DevExtreme's default tooltip styling (no custom HTML/colors)
                            text: `${arg.argumentText}: ${Shared.formatNumber(arg.value)} suppliers (${getZoneLabel(arg.value)})`
                        };
                    }
                }
            });
        }

        setCalendarEvents(events) {
            this._calendarEvents = Array.isArray(events) ? events : [];
            this._calendarEventMap = new Map();

            for (const ev of this._calendarEvents) {
                const d = Shared.toDate(ev.date);
                if (!d) continue;
                const key = Shared.formatYMD(d);
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
            const d = Shared.toDate(date) || new Date();
            const key = Shared.formatYMD(d);
            const list = this._calendarEventMap.get(key) || [];

            const titleDate = Shared.formatDMY ? Shared.formatDMY(d) : key;
            const title = `Selected: ${titleDate}`;

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
                if (type === 'systemMaintenance') return 'report-calendar-badge--maintenance';
                if (type === 'training') return 'report-calendar-badge--training';
                return '';
            };

            const badgeText = (type) => {
                if (type === 'holiday') return 'Holiday';
                if (type === 'inventory') return 'Inventory';
                if (type === 'monthClose') return 'Close';
                if (type === 'systemMaintenance') return 'Maintenance';
                if (type === 'training') return 'Training';
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
            const key = Shared.monthKey(now);
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
                const cur = r.currencyCode || r.currency || 'N/A';
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
