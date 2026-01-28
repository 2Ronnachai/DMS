class AppFormComponents{
    constructor(appMain){
        this.appMain = appMain;

        this.cacheConfig= {
            categories: { enabled: true, ttl: 10 * 60 * 1000 },
            materialTypes: { enabled: true, ttl: 10 * 60 * 1000 },
            materialTypesWithoutCategoryId: { enabled: true, ttl: 10 * 60 * 1000 },
            materialTypesWithoutSupplier: { enabled: true, ttl: 10 * 60 * 1000 },
            suppliers: { enabled: true, ttl: 10 * 60 * 1000 },
            units: { enabled: true, ttl: 15 * 60 * 1000 }, 
            exchangeRates: { enabled: true, ttl: 5 * 60 * 1000 }, 
            groupOfGoods: { enabled: true, ttl: 10 * 60 * 1000 },
            materials: { enabled: true, ttl: 10 * 60 * 1000 },
            items: { enabled: false, ttl: 0 }  
        };
    }

    // Helper methods to get data sources with caching
    async _fetchWithCache(url, configKey) {
        const config = this.cacheConfig[configKey];
        
        const response = config.enabled 
            ? await this.appMain.http.getCache(url, config.ttl)
            : await this.appMain.http.get(url );
            
        return response.success ? response.data : [];
    }

    async getCategoryDataSource(supplierCode = null) {
        const url = supplierCode 
            ? this.appMain.endpoints.lookups.category.supplier(supplierCode)
            : this.appMain.endpoints.lookups.category.purchaser;
  
        return await this._fetchWithCache(url, 'categories');
    }

    async getMaterialTypeDataSource(categoryId = null) {
        const url = categoryId 
            ? this.appMain.endpoints.lookups.materialTypes(categoryId)
            : this.appMain.endpoints.lookups.materialTypes();
        return categoryId ? await this._fetchWithCache(url, 'materialTypes') : await this._fetchWithCache(url, 'materialTypesWithoutCategoryId');
    }

    async getMaterialTypeDataSourceWithoutSupplier(categoryId = null, supplierCode = null) {
        const url = this.appMain.endpoints.lookups.materialTypesWithoutSupplier(categoryId, supplierCode);
        return await this._fetchWithCache(url, 'materialTypesWithoutSupplier');
    }

    async getSupplierDataSource() {
        return await this._fetchWithCache(
            this.appMain.endpoints.lookups.supplierPurchasers, 
            'suppliers'
        );
    }

    async getUnitDataSource() {
        return await this._fetchWithCache(
            this.appMain.endpoints.lookups.units, 
            'units'
        );
    }

    async getExchangeRatesDataSource() {
        return await this._fetchWithCache(
            this.appMain.endpoints.lookups.exchangeRates, 
            'exchangeRates'
        );
    }

    async getGroupOfGoodsDataSource() {
        return await this._fetchWithCache(
            this.appMain.endpoints.lookups.groupOfGoods, 
            'groupOfGoods'
        );
    }

    async getMaterialDataSource(categoryId, materialTypeId) {
        const url = this.appMain.endpoints.lookups.materials(categoryId, materialTypeId);
        return await this._fetchWithCache(url, 'materials');
    }

    async getItemsDataSource(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        const url = this.appMain.endpoints.lookups.dataItems(params);
        return await this._fetchWithCache(url, 'items');
    }

    setCacheEnabled(configKey, enabled) {
        if (this.cacheConfig[configKey]) {
            this.cacheConfig[configKey].enabled = enabled;
        }
    }

    setCacheTTL(configKey, ttl) {
        if (this.cacheConfig[configKey]) {
            this.cacheConfig[configKey].ttl = ttl;
        }
    }

    clearCache(configKey) {
        const urlMap = {
            categories: this.appMain.endpoints.lookups.categories,
            materialTypes: this.appMain.endpoints.lookups.materialTypes,
            suppliers: this.appMain.endpoints.lookups.supplierPurchasers,
            units: this.appMain.endpoints.lookups.units,
            exchangeRates: this.appMain.endpoints.lookups.exchangeRates,
            groupOfGoods: this.appMain.endpoints.lookups.groupOfGoods
        };

        const url = urlMap[configKey];
        if (url) {
            AppCore.Cache.delete(`GET:${url}`);
            console.log(`Cache cleared for ${configKey}`);
        }
    }

    clearAllCache() {
        Object.keys(this.cacheConfig).forEach(key => {
            this.clearCache(key);
        });
    }

    async refreshLookup(configKey, ...args) {
        this.clearCache(configKey);
        
        const methodMap = {
            categories: 'getCategoryDataSource',
            materialTypes: 'getMaterialTypeDataSource',
            suppliers: 'getSupplierDataSource',
            units: 'getUnitDataSource',
            exchangeRates: 'getExchangeRatesDataSource',
            groupOfGoods: 'getGroupOfGoodsDataSource',
            materials: 'getMaterialDataSource',
            items: 'getItemsDataSource'
        };

        const method = methodMap[configKey];
        if (method && this[method]) {
            return await this[method](...args);
        }
    }
}