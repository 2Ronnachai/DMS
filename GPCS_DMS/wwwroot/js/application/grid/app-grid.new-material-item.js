class NewMaterialItemsGridConfig {
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
            columnDefinitions.NO,
            columnDefinitions.CATEGORY(this.lookupData),
            columnDefinitions.MATERIAL_TYPE(this.lookupData),
            columnDefinitions.DESCRIPTION,
            columnDefinitions.MATERIAL_DESCRIPTION,
            columnDefinitions.ITEM_DESCRIPTION,
            columnDefinitions.UNIT,
            columnDefinitions.MATERIAL_UNIT,
            columnDefinitions.ITEM_UNIT,
            columnDefinitions.PRICE,
            columnDefinitions.MATERIAL_UNIT_PRICE,
            columnDefinitions.ITEM_UNIT_PRICE,
            columnDefinitions.MINIMUM_ORDER,
            columnDefinitions.COST_CENTER,
            columnDefinitions.CONVERSION_RATE,
            columnDefinitions.MOQ,
            columnDefinitions.LOT_SIZE,
            columnDefinitions.CURRENCY,
            columnDefinitions.LEAD_TIME,
            columnDefinitions.QUOTATION_EXPIRY_DATE(this.appMain.getDateFormat()),
            columnDefinitions.GROUP_OF_GOODS(this.lookupData),
        ];

        if (editable) {
            columns.push(
                columnDefinitions.DELETE_BUTTON((e) => this.handler.handleSingleDelete(e))
            );
        }

        return columns;
    }

    getConfig(mode) {
        const configs = {
            'create': this._getEditableConfig(),
            'edit': this._getEditableConfig(),
            'view': this._getViewConfig(),
            'approve': this._getViewConfig()
        };

        return configs[mode] || this._getViewConfig();
    }

    _getEditableConfig() {
        return {
            columns: this.getColumns(true),
            toolbar: this.toolbarBuilder.getEditableToolbar(),
            editing: {
                mode: 'row',
                useIcons: true,
                allowUpdating: false,
                allowDeleting: false,
                allowAdding: false,
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
            }
        };
    }
}