class AppGrid {
    constructor(appMain, applicationData) {
        this.appMain = appMain;
        this.data = applicationData;

        this.originalData = applicationData ? 
            JSON.parse(JSON.stringify(applicationData)) : null;

        this.container = document.getElementById('itemsSection');
        this.gridInstance = null;
        this.gridConfig = null;

        this.initialSnapshots = new Map();
        
        window.appGridInstance = this;
    }

    async _loadLookupData() {
        const [categories, materialTypes, groupOfGoods, units, currencies] = await Promise.all([
            this.appMain.formComponents.getCategoryDataSource(),
            this.appMain.formComponents.getMaterialTypeDataSource(),
            this.appMain.formComponents.getGroupOfGoodsDataSource(),
            this.appMain.formComponents.getUnitDataSource(),
            this.appMain.formComponents.getExchangeRatesDataSource()
        ]);

        this.lookupData = { categories, materialTypes, groupOfGoods, units, currencies };
    }

    _initializeGrid() {
        const config = this.gridConfig.getConfig(
            this.appMain.applicationType,
            this.appMain.mode
        );

        const materialsData = this.data?.materials ? 
            JSON.parse(JSON.stringify(this.data.materials)) : [];

        const baseConfig = {
            dataSource: materialsData,
            showBorders: true,
            showRowLines: true,
            showColumnLines: true,
            allowColumnReordering: true,
            columnAutoWidth: true,
            columnFixing: { enabled: true },
            hoverStateEnabled: true,
            paging: { pageSize: 10 },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [10, 25, 50, 100],
                showInfo: true
            },
            searchPanel: {
                visible: true,
                width: 240,
                placeholder: 'Search...'
            },
            scrolling: {
                mode: 'standard',
                showScrollbar: 'always',
            },
            filterRow: { visible: false },
            noDataText: 'No items added yet. Click "Add Item" to begin.',
            ...config
        };

        this.gridInstance = $(this.container)
            .dxDataGrid(baseConfig)
            .dxDataGrid('instance');
    }

    async render() {
        // Clear container
        this.container.innerHTML = '';
        await this._loadLookupData();
        
        this.gridConfig = new AppGridConfig(this.appMain, this.lookupData);

        const gridContainer = document.createElement('div');
        gridContainer.className = 'application-grid-container';
        gridContainer.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <span class="header-application-type">
                        ${this.appMain.getApplicationTypeDisplayName()}
                    </span>
                    <div id="gridInstanceContainer" class="mt-3"></div>
                </div>
            </div>
        `;
        
        this.container.append(gridContainer);
        this.container = gridContainer.querySelector('#gridInstanceContainer');

        this._initializeGrid();
    }

    // ============================================
    // PUBLIC API
    // ============================================
    
    isDataChanged() {
        const currentItems = this.get() || [];
        const originalItems = this.originalData?.materials || [];
        console.log('Current Items:', currentItems);
        console.log('Original Items:', originalItems);
        
        if (currentItems.length !== originalItems.length) {
            return true;
        }

        for (let i = 0; i < currentItems.length; i++) {
            const currentItem = currentItems[i];
            const originalItem = originalItems.find(item => item.id === currentItem.id);
            if (!originalItem || JSON.stringify(currentItem) !== JSON.stringify(originalItem)) {
                return true;
            }
        }
        
        return false;
    }

    update(data) {
        this.data = data;

        this.originalData = data ? JSON.parse(JSON.stringify(data)) : null;

        if (this.gridInstance) {
            this.initialSnapshots.clear();
            const materialsData = data?.materials ? 
                JSON.parse(JSON.stringify(data.materials)) : [];
            
            this.set(materialsData);
        }
    }

    addItem(item) {
        if (this.gridInstance) {
            const dataSource = this.get() || [];

            if (!itemCopy.item.itemHistory) {
                const snapshot = this._createSnapshot(itemCopy.item);
                this.initialSnapshots.set(itemCopy.item.itemCode, snapshot);
            }

            dataSource.push(item);
            this.set(dataSource);
            this.refresh();
        }
    }

    addItems(items) {
        if (this.gridInstance) {
            const dataSource = this.get() || [];

            const itemsCopy = JSON.parse(JSON.stringify(items));

            itemsCopy.forEach(material => {
                if (!material.item.itemHistory) {
                    const snapshot = this._createSnapshot(material.item);
                    this.initialSnapshots.set(material.item.itemCode, snapshot);
                }
            });

            dataSource.push(...items);
            this.set(dataSource);
            this.refresh();
        }
    }

    updateItem(itemId, updatedData) {
        if (this.gridInstance) {
            const dataSource = this.get() || [];
            const index = dataSource.findIndex(item => item.id === itemId);
            if (index !== -1) {
                const updatedDataCopy = JSON.parse(JSON.stringify(updatedData));
                dataSource[index] = { ...dataSource[index], ...updatedDataCopy };
                this.set(dataSource);
                this.refresh();
            }
        }
    }

    removeItem(itemId) {
        if (this.gridInstance) {
            const dataSource = this.get() || [];
            const filtered = dataSource.filter(item => item.id !== itemId);

            this.initialSnapshots.delete(itemId);

            this.set(filtered);
            this.refresh();
        }
    }

    _createSnapshot(item) {
        return {
            itemDescription: item.itemDescription,
            itemUnit: item.itemUnit,
            itemUnitPrice: item.itemUnitPrice,
            moq: item.moq,
            lotSize: item.lotSize,
            leadTime: item.leadTime,
            currency: item.currency,
            conversionRate: item.conversionRate,
            quotationExpiryDate: item.quotationExpiryDate,
            groupOfGoods: item.groupOfGoods
        };
    }

    getInitialSnapshot(itemCode) {
        return this.initialSnapshots.get(itemCode);
    }

    getPopupContainer(){
        return document.querySelector('.application-grid-container') || document.body;
    }

    set(data) {
        if (this.gridInstance) {
            this.gridInstance.option('dataSource', data);
        }
    }

    get() {
        return this.gridInstance?.option('dataSource');
    }

    getSelectedItems() {
        return this.gridInstance?.getSelectedRowsData() || [];
    }

    clearSelection() {
        this.gridInstance?.clearSelection();
    }

    refresh() {
        this.gridInstance?.refresh();
    }

    reset(){
        if (this.gridInstance) {
            this.set([]);
            this.initialSnapshots.clear();

            if (this.originalData) {
                this.originalData.materials = [];
            }

            this.refresh();
        }
    }

    validate() {
        const items = this.get();
        if (!items || items.length === 0) {
            return {
                isValid: false,
                message: 'At least one item is required in the items list.'
            };
        }
        return {
            isValid: true
        };
    }
}