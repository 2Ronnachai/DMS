class GridFactory {
    static createGrid(config) {
        const {
            gridId,
            container,
            endpoint,
            keyField,
            columns,
            exportFileName,
            paramaters = {},
            ...otherOptions
        } = config;

        // Validation
        if (typeof GridCustomStore === 'undefined') {
            console.error('GridCustomStore is not defined!');
            return null;
        }
        if (typeof BaseGrid === 'undefined') {
            console.error('BaseGrid is not defined!');
            return null;
        }

        // Create Store
        const store = new GridCustomStore({
            endpoint: endpoint,
            keyField: keyField,
            parameters: paramaters,

            onBeforeAction: (op, data) => {
                if (op === "load") {
                    appLoading.show(`Loading ${exportFileName}...`);
                }
            },

            onAfterAction: (op, data) => {
                if (op === "load") {
                    appLoading.hide();
                }
            },

            onError: (error, op) => {
                appLoading.hide();
                appNotification.show(
                    `Failed to ${op} data: ${error.message}`,
                    "error",
                    { duration: 3000 }
                );
            }
        });

        // Default Grid Options
        const defaultOptions = {
            gridId: gridId,
            container: container,
            dataSource: store.getStore(),
            columns: columns,
            keyExpr: keyField,

            // Features
            enableStateStorage: true,
            enableExport: true,
            enableFilterRow: true,
            enableFilterPanel: true,
            enableHeaderFilter: true,
            enableSearchPanel: true,
            enableColumnChooser: true,
            enableGrouping: true,
            enableSelection: true,
            selectionMode: 'multiple',
            enableRowNumber: true,
            rowAlternationEnabled: false,
            columnAutoWidth: true,

            // Virtual Scrolling
            enableVirtualScrolling: true,
            scrollingMode: 'virtual',

            // Remote Operations
            remoteOperations: {
                filtering: true,
                sorting: true,
                grouping: true,
                paging: true
            },

            // Editing
            enableEditing: false,
            editMode: 'popup',

            // Paging
            enablePaging: true,
            pageSize: 50,

            height: '100%',
            exportFileName: exportFileName,

            onInitialized: (e) => { },

            onContentReady: (e) => { },

            onSelectionChanged: (e) => {
                const selectedCount = e.selectedRowsData.length;
                if (selectedCount > 0) {
                    console.log(`Selected ${selectedCount} row(s)`);
                }
            },

            onRowClick: (e) => {
                if (e.rowType === 'data') {
                    console.log('Clicked row:', e.data);
                }
            }
        };

        // Merge with custom options
        const gridOptions = { ...defaultOptions, ...otherOptions };

        // Create and Initialize Grid
        const grid = new BaseGrid(gridOptions);

        try {
            grid.initialize();
            return grid;
        } catch (error) {
            appNotification.show('Failed to initialize grid: ' + error.message, 'error');
            return null;
        }
    }

    static getGPCSAuditColumns() {
        return [
            GridHelper.createColumn('appUserId', 'App By', {
                width: 120,
                allowEditing: false
            }),
            GridHelper.createColumn('appDate', 'App Date', {
                width: 150,
                allowEditing: false
            }),
            GridHelper.createColumn('updUserId', 'Updated By', {
                width: 120,
                allowEditing: false
            }),
            GridHelper.createColumn('updDate', 'Updated Date', {
                width: 150,
                allowEditing: false
            }),
            GridHelper.createColumn('updPgm', 'Program', {
                width: 100,
                visible: false,
                allowEditing: false
            })
        ];
    }

    static getAuditColumns() {
        return [
            // Audit Trail
            GridHelper.createColumn('createdBy', 'Created By', {
                width: 120,
                allowEditing: false
            }),
            GridHelper.createDateColumn('createdAt', 'Created At', 'dd/MM/yyyy HH:mm', {
                width: 150,
                allowEditing: false
            }),
            GridHelper.createColumn('updatedBy', 'Updated By', {
                width: 120,
                allowEditing: false
            }),
            GridHelper.createDateColumn('updatedAt', 'Updated At', 'dd/MM/yyyy HH:mm', {
                width: 150,
                allowEditing: false
            }),
        ];
    }
}

// Make it available globally
window.GridFactory = GridFactory;
