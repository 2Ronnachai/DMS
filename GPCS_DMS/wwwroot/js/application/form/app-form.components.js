class AppFormComponents{
    constructor(appMain){
        this.appMain = appMain;
    }

    async getCategoryDataSource(supplierId = null) {
        const url = supplierId 
            ? `categories?supplierId=${supplierId}`
            : this.appMain.endpoints.lookups.categories;
  
        return await this.appMain.http.get(url ).then(response => {
            return response.success ? response.data : [];
        });
    }

    async getMaterialTypeDataSource(categoryId = null) {
        const url = categoryId 
            ? `materialtypes?categoryId=${categoryId}`
            : this.appMain.endpoints.lookups.materialTypes;
            
        return await this.appMain.http.get(url ).then(response => {
            return response.success ? response.data : [];
        }); 
    }

    async getSupplierDataSource() {
        return await this.appMain.http.get(this.appMain.endpoints.lookups.supplierPurchasers).then(response => {
            return response.success ? response.data : [];
        });
    }

    async getUnitDataSource() {
        return await this.appMain.http.get(this.appMain.endpoints.lookups.units).then(response => {
            return response.success ? response.data : [];
        });
    }

    async getExchangeRatesDataSource() {
        return await this.appMain.http.get(this.appMain.endpoints.lookups.exchangeRates).then(response => {
            return response.success ? response.data : [];
        });
    }

    async getGroupOfGoodsDataSource() {
        return await this.appMain.http.get(this.appMain.endpoints.lookups.groupOfGoods).then(response => {
            return response.success ? response.data : [];
        });
    }

    async getMaterialDataSource(categoryId, materialTypeId) {
        const url = `materials?categoryId=${categoryId}&materialTypeId=${materialTypeId}`;
        return await this.appMain.http.get(url ).then(response => {
            return response.success ? response.data : [];
        });
    }

    async getItemsDataSource(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.appMain.http.get(`items?${params}` ).then(response => {
            return response.success ? response.data : [];
        });
    }
}