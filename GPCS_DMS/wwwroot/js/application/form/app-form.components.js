class AppFormComponents{
    constructor(appMain){
        this.appMain = appMain;
    }

    async getCategoryDataSource(supplierId = null) {
        const url = supplierId 
            ? `categories?supplierId=${supplierId}`
            : 'categories';
            
        return await this.appMain.http.get(url ).then(response => {
            return response.success ? response.data : [];
        });
    }

    async getMaterialTypeDataSource(categoryId = null) {
        const url = categoryId 
            ? `material-types?categoryId=${categoryId}`
            : 'material-types';
            
        return await this.appMain.http.get(url ).then(response => {
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