class AppGridConfig {
    constructor(appMain, lookupData) {
        this.appMain = appMain;
        this.lookupData = lookupData;
        this.configs = new Map();
        this._registerConfigs();
    }

    _registerConfigs() {
        this.configs.set('newmaterialsitems', new NewMaterialItemsGridConfig(this.appMain, this.lookupData));
        this.configs.set('newitems', new NewItemsGridConfig(this.appMain, this.lookupData));
        this.configs.set('edititems', new EditItemsGridConfig(this.appMain, this.lookupData));
        this.configs.set('deleteitems', new DeleteItemsGridConfig(this.appMain, this.lookupData));
    }

    getConfig(appType, mode) {
        const config = this.configs.get(appType.toLowerCase());
        
        if (!config) {
            console.error(`Config not found for application type: ${appType}`);
            return this._getDefaultConfig();
        }
        return config.getConfig(mode.toLowerCase());
    }

    _getDefaultConfig() {
        return {
            columns: [ColumnDefinitions.ID],
            toolbar: { items: ['searchPanel'] },
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