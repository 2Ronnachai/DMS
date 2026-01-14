class AppHeaderPopup {
    constructor(appMain) {
        this.appMain = appMain;

        this.popupInstance = null;
        this.gridInstance = null;
        this.selectedQuotation = null;
        this.onSelectCallback = null;

        this.supplierCode  = null;
        this.supplierDisplayName = null;

        this.$infoDiv = null;
    }

    async show(supplierCode,displayName, onSelect) {
        this.onSelectCallback = onSelect;
        this.selectedQuotation = null;
        this.supplierCode = supplierCode;
        this.supplierDisplayName = displayName;

        if(!this.popupInstance){
            await this._createPopup();
        } else{
            this._updateInfoSection();
            this.popupInstance.show();
            await this._loadQuotations();
        }
    }

    async _createPopup() {
        const popupContainer = document.createElement('div');
        document.body.appendChild(popupContainer);

        this.popupInstance = $(popupContainer).dxPopup({
            title: 'Select Quotation',
            width: '85vw',
            height: '80vh',
            showCloseButton: true,
            dragEnabled: false,
            showTitle: true,
            contentTemplate: (contentElement) => {
                this._createContent(contentElement);
            },
            onShowing: () => {
                // Reset selection when showing
                this.selectedQuotation = null;
            },
            onShown: async () => {
                if (this.gridInstance) {
                    await this._loadQuotations();
                }
            },
            toolbarItems: this._getToolbarItems(),
            onHidden: () => {
                this.selectedQuotation = null;
            }
        }).dxPopup('instance');

        this.popupInstance.show();
    }

    _createContent(contentElement) {
        const $wrapper = $('<div>').css({
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }).appendTo(contentElement);

        // Info Section
        this._createInfoSection($wrapper);

        // Grid Section
        const $gridContainer = $('<div>').css({
            flexGrow: 1,
            marginTop: '16px'
        }).appendTo($wrapper);
        
        this._createGrid($gridContainer);
    }

    _createInfoSection($parent) {
        const $infoDiv = $('<div>').css({
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            marginBottom: '8px'
        }).appendTo($parent);

        this.$infoDiv = $infoDiv;
        this._updateInfoSection();
    }

    _updateInfoSection() {
        if (this.$infoDiv) {
            const infoText = this.supplierCode
                ? `Showing quotations for supplier: <strong>${this.supplierDisplayName || this.supplierCode}</strong>`
                : 'Showing <strong>all quotations</strong>';

            this.$infoDiv.html(`
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-info-circle" style="color: #1976d2;"></i>
                    <span style="color: #616161; font-size: 13px;">
                        ${infoText}
                    </span>
                </div>
            `);
        }
    }

    _createGrid($container) {
        this.gridInstance = $container.dxDataGrid({
            dataSource:{
                store:{
                    type: 'array',
                    data: [],
                    key: 'id'
                }
            },
            height: '80%',
            remoteOperations: false,
            showBorders: true,
            showRowLines: true,
            hoverStateEnabled: true,
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnAutoWidth: true,
            selection: {
                mode: 'single',
                showCheckBoxesMode: 'always'
            },
            paging: {
                enabled: false
            },
            pager: {
                visible: false,
            },
            filterRow: {
                visible: true,
                applyFilter: 'auto'
            },
            headerFilter: {
                visible: true
            },
            columns: this._getColumns(),
            onToolbarPreparing: (e) => {
                e.toolbarOptions.items.unshift({
                    location: 'before',
                    template: () => {
                        const $container = $('<div>').css({
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#424242'
                        });

                        this.totalCountElement = $('<span>').text('0 Quotations').appendTo($container);

                        return $container;
                    }
                });

                e.toolbarOptions.items.unshift({
                    location: 'after',
                    widget: 'dxTextBox',
                    options: {
                        width: 250,
                        placeholder: 'Search quotations...',
                        mode: 'search',
                        onValueChanged: (args) => {
                            this.gridInstance.searchByText(args.value);
                        }
                    }
                });
            },
            onSelectionChanged: (e) => {
                this.selectedQuotation = e.selectedRowsData[0] || null;
            },
            onRowDblClick: (e) => {
                this.selectedQuotation = e.data;
                this._handleSelect();
            },
            loadPanel: {
                enabled: true,
                text: 'Loading quotations...'
            },
            noDataText: 'No quotations found for this vendor'
        }).dxDataGrid('instance');
    }

    _updateTotalCount() {
        if (!this.totalCountElement || !this.gridInstance) return;

        const dataSource = this.gridInstance.getDataSource();
        
        if (dataSource) {
            dataSource.load().done(() => {
                const totalCount = dataSource.totalCount();
                this.totalCountElement.text(`Total: ${totalCount} Quotation${totalCount !== 1 ? 's' : ''}`);
            });
        } else {
            this.totalCountElement.text('0 Quotations');
        }
    }

    _getColumns() {
        return [
            {
                dataField: 'code',
                caption: 'Quotation Code',
                width: 160,
                fixed: true,
                cellTemplate: (container, options) => {
                    $('<div>').css({
                        fontWeight: '500',
                        color: '#1976d2'
                    }).text(options.value).appendTo(container);
                }
            },
            {
                dataField: 'vendorCode',
                caption: 'Vendor Code',
                width: 120
            },
            {
                dataField: 'vendorName',
                caption: 'Vendor Name',
                minWidth: 200
            },
            {
                dataField: 'requestDate',
                caption: 'Request Date',
                dataType: 'datetime',
                width: 150,
                format: 'dd/MM/yyyy HH:mm',
                sortOrder: 'desc'
            },
            {
                dataField: 'requesterName',
                caption: 'Requester',
                width: 150
            },
            {
                fixed: true,
                fixedPosition: 'right',
                type: 'buttons',
                buttons: [
                    {
                        hint: 'View Details',
                        icon: 'search',
                        onClick: (e) => {
                            const quotationData = e.row.data;
                            this._viewQuotationDetails(quotationData);
                        }
                    }
                ]
            }
        ];
    }

    async _viewQuotationDetails(quotation) {
        const quotationCode = quotation.code;
        if (!quotationCode) {
            this.appMain.notification.warning('Quotation code is missing.');
            return;
        }

        const url = `${window.APP_CONFIG.qcsUrl.view}${quotationCode}`;
        window.open(url, '_blank');
    }

    async _loadQuotations() {
        try {
            const apiUrl = this.supplierCode 
                ? `${window.APP_CONFIG.qcsUrl.service}Integration/GetRequestByVendorCode?vendorCode=${encodeURIComponent(this.supplierCode)}`
                : `${window.APP_CONFIG.qcsUrl.service}Integration/GetRequestAll`;

            const response = await this.appMain.http.get(apiUrl);

            if(!response.success){
                throw new Error(response.message || 'Unknown error from server.');
            }

            const data = response.data || [];
            this.gridInstance.option('dataSource', {
                store: {
                    type: 'array',
                    data: data,
                    key: 'id'
                }
            });

            await this.gridInstance.refresh();

            this._updateInfoSection();
            this._updateTotalCount(); 

             // Show notification
            if (data.length === 0) {
                const message = this.supplierCode 
                    ? `No quotations found for supplier: ${this.supplierCode}`
                    : 'No quotations available';
                this.appMain.notification.info(message);
            } else {
                const message = this.supplierCode 
                    ? `Found ${data.length} quotation(s) for supplier: ${this.supplierCode}`
                    : `Found ${data.length} quotation(s)`;
                console.log(message);
            }

        }catch (error) {
            this.appMain.notification.error('Failed to load quotations: ' + error.message);
            console.error('Load quotations error:', error);

            this.gridInstance.option('dataSource', {
                store: {
                    type: 'array',
                    data: [],
                    key: 'id'
                }
            });
            this._updateTotalCount(); 
        }
    }

    _getToolbarItems() {
        return [
            {
                widget: 'dxButton',
                location: 'after',
                toolbar: 'bottom',
                options: {
                    text: 'Select',
                    type: 'default',
                    icon: 'check',
                    onClick: () => this._handleSelect()
                }
            },
            {
                widget: 'dxButton',
                location: 'after',
                toolbar: 'bottom',
                options: {
                    text: 'Cancel',
                    icon: 'close',
                    onClick: () => this._handleCancel()
                }
            }
        ];
    }

    _handleSelect() {
        if (!this.selectedQuotation) {
            this.appMain.notification.warning('Please select a quotation');
            return;
        }

        if (this.onSelectCallback && typeof this.onSelectCallback === 'function') {
            this.onSelectCallback(this.selectedQuotation);
        }

        this.hide();
    }

    _handleCancel() {
        this.selectedQuotation = null;
        this.hide();
    }

    hide() {
        if (this.popupInstance) {
            this.popupInstance.hide();
        }
    }

    dispose() {
        this.selectedQuotation = null;
        this.onSelectCallback = null;
        this.supplierCode = null;
        this.supplierDisplayName = null;
        this.$infoDiv = null;
        
        if (this.gridInstance) {
            this.gridInstance.dispose();
            this.gridInstance = null;
        }
        
        if (this.popupInstance) {
            this.popupInstance.dispose();
            this.popupInstance = null;
        }
    }
}