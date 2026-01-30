class DeleteItemsGridConfig {
    constructor(appMain, lookupData) {
        this.appMain = appMain;
        this.lookupData = lookupData;
        this.handler = new GridHandler(appMain);
        this.toolbarBuilder = new GridToolbarBuilder(appMain);
    }

    getColumns(editable = false) {
        const columns = [
            columnDefinitions.ID,
            columnDefinitions.ITEM_ID,
            {
                ...columnDefinitions.NO,
                fixed: true,
                fixedPosition: 'left',
            }
        ];

        columns.push(...this._getItemColumnsConfig());

        columns.push(...this._getMaterialColumnsConfig());

        if (editable) {
            columns.push(
                columnDefinitions.DELETE_BUTTON((e) => this.handler.handleSingleDelete(e))
            );
        }
        return columns;
    }

    _getItemColumnsConfig() {
        return [
            {
                ...columnDefinitions.ITEM_CODE,
                visible: true
            },
            {
                ...columnDefinitions.ITEM_DESCRIPTION,
                visible: true
            },
            {
                ...columnDefinitions.ITEM_UNIT,
                visible: true,
                lookup: {
                    dataSource: {
                        store: this.lookupData.units,
                        sort: 'code',
                        paginate: true,
                        pageSize: 20,
                    },
                    valueExpr: 'code',
                    displayExpr: 'code',
                }
            },
            columnDefinitions.CONVERSION_RATE,
            {
                ...columnDefinitions.ITEM_UNIT_PRICE,
                visible: true,
                dataType: 'number',
                format: {
                    type: 'fixedPoint',
                    precision: 4
                },
            },
            columnDefinitions.CURRENCY,
            columnDefinitions.MOQ,
            columnDefinitions.LOT_SIZE,
            columnDefinitions.LEAD_TIME,
            columnDefinitions.QUOTATION_EXPIRY_DATE(this.appMain.getDateFormat()),
            columnDefinitions.GROUP_OF_GOODS(this.lookupData),
            {
                dataField: 'item.po',
                caption: 'PO',
                fixed: true,
                fixedPosition: 'right',
            },
            {
                dataField: 'item.pr',
                caption: 'PR',
                fixed: true,
                fixedPosition: 'right',
            },
            {
                dataField: 'item.inventory',
                caption: 'Inv',
                fixed: true,
                fixedPosition: 'right',
            }
        ];
    }

    _getMaterialColumnsConfig() {
        return [
            {
                ...columnDefinitions.MATERIAL_CODE,
                visible: false
            },
            {
                ...columnDefinitions.CATEGORY(this.lookupData),
                visible: false
            },
            {
                ...columnDefinitions.MATERIAL_TYPE(this.lookupData),
                visible: false
            },
            {
                ...columnDefinitions.MATERIAL_DESCRIPTION,
                visible: false
            },
            {
                ...columnDefinitions.MATERIAL_UNIT,
                visible: false
            },
            {
                ...columnDefinitions.MATERIAL_UNIT_PRICE,
                visible: false
            },
            {
                ...columnDefinitions.COST_CENTER,
                visible: false
            },
            {
                ...columnDefinitions.MINIMUM_ORDER,
                visible: false
            }
        ];
    }

    getConfig(mode) {
        const configs = {
            'create': this._getEditableConfig(),
            'edit': this._getEditableConfig(),
            'view': this._getViewConfig(),
            'approve': this._getViewConfig()
        };
        configs.onCellPrepared = (e) => {
            if (e.rowType === 'data' &&
                ['po', 'pr', 'inventory'].includes(e.column.dataField) &&
                e.value > 0) {
                e.cellElement.addClass('cell-alert');
            }
        }
        return configs[mode] || this._getViewConfig();
    }

    _getEditableConfig() {
        return {
            columns: this.getColumns(true),
            toolbar: this.toolbarBuilder.getEditableToolbar(),
            editing: {
                allowAdding: false,
                allowDeleting: false,
                allowUpdating: false,
                confirmDelete: false,
            },
            selection: {
                mode: 'multiple',
            }
        };
    }

    _getViewConfig() {
        return {
            columns: this.getColumns(false),
            toolbar: this.toolbarBuilder.getViewOnlyToolbar(),
            editing: {
                allowAdding: false,
                allowDeleting: false,
                allowUpdating: false,
            },
            selection: {
                mode: 'none'
            },
        };
    }
}