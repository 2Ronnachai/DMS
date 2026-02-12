class DashboardService {
    constructor(options = {}) {
        this.http = options.http;
        this.notify = options.notify;
        this.loading = options.loading;
        this.containerWrapper = options.containerWrapper;

        this.endpoints = {
            getRoleWithSummary: `applications/role-summary`,
            applicationTypes:{
                lookup: `applicationTypes/lookups`,
            },
            applications: `applications/dashboard`
        };
    }

    async getRoleWithSummary(){
        try{
            const response = await this.http.get(this.endpoints.getRoleWithSummary);
            if(response && response.success){
                return response.data;
            }
        }catch(error){
            this.notify.error('Failed to load user role and summary: ' + error.message);
            console.error('Error loading user role and summary:', error);
        }
    }

    async getApplicationTypes(){
        try{
            const response = await this.http.get(this.endpoints.applicationTypes.lookup);
            if(response && response.success){
                return response.data;
            }
        }catch(error){
            this.notify.error('Failed to load application types: ' + error.message);
            console.error('Error loading application types:', error);
        }
    }

    async loadApplications(key){
        const loadingId = this.loading.showOn(this.containerWrapper, {
            text: 'Loading dashboard...',
            size: 'medium'
        });
        try{
            if(!key){
                this.notify.error('Invalid application status key for loading applications.');
                return;
            }
            // type?=key
            var url = `${this.endpoints.applications}?type=${key}`;
            const response = await this.http.get(url);
            if(response && response.success){
                return response.data;
            }
        }catch(error){
            this.notify.error('Failed to load applications: ' + error.message);
            console.error('Error loading applications:', error);
        }finally{
            this.isLoading = false;
            this.loading.hideOn(loadingId);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}