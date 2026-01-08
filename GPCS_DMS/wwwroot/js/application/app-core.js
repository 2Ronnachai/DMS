// app-core.js
class AppCore {
    constructor(){
        if(AppCore.instance){
            return AppCore.instance;
        }

        AppCore.instance = this;
        this.config ={
            baseURL: window.APP_CONFIG?.baseUrl || '',
        };
    }

    static Http = class {
        static async _request(url, options = {}){
            const core = AppCore.instance;
            const fullUrl = url.startsWith('http') ? url : core.config.baseURL + url;

            const defaultOptions = {
                credentials: 'include',
                headers:{
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            };

            try{
                const response = await fetch(fullUrl, {...defaultOptions, ...options});
                if(!response.ok){
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                if(contentType && contentType.includes('application/json')){
                    return await response.json();
                }

                return await response.text();
            }catch (error){
                console.error('Fetch error:', error);
                throw error;
            }
        }

        /**
         * Handle API response with ApiResponse<T> format (supports both PascalCase and camelCase)
         * @param {Promise} requestPromise - Promise from fetch
         * @returns {Promise<{success: boolean, data: any, message: string, errors: string[]}>}
         */
        static async handleApiResponse(requestPromise) {
            try {
                const apiResponse = await requestPromise;
                
                // If response follows ApiResponse<T> format (PascalCase or camelCase)
                if (apiResponse && typeof apiResponse === 'object') {
                    const isApiFormat = ('Success' in apiResponse) || ('success' in apiResponse);
                    
                    if (isApiFormat) {
                        // Support both PascalCase (C# default) and camelCase (configured naming policy)
                        const successField = 'Success' in apiResponse ? 'Success' : 'success';
                        const dataField = 'Data' in apiResponse ? 'Data' : 'data';
                        const messageField = 'Message' in apiResponse ? 'Message' : 'message';
                        const errorsField = 'Errors' in apiResponse ? 'Errors' : 'errors';
                        
                        return {
                            success: apiResponse[successField],
                            data: apiResponse[dataField] ?? null,
                            message: apiResponse[messageField] ?? '',
                            errors: apiResponse[errorsField] ?? []
                        };
                    }
                }

                // Fallback: assume successful response
                return {
                    success: true,
                    data: apiResponse,
                    message: 'Operation successful',
                    errors: []
                };
            } catch (error) {
                console.error('Error handling API response:', error);
                return {
                    success: false,
                    data: null,
                    message: error.message || 'Unknown error occurred',
                    errors: [error.message || 'Unknown error']
                };
            }
        }

        // Public HTTP Methods
        static async get(url) {
            return this.handleApiResponse(this._request(url, { method: 'GET' }));
        }

        static async post(url, data) {
            return this.handleApiResponse(this._request(url, { 
                method: 'POST', 
                body: JSON.stringify(data) 
            }));
        }

        static async put(url, data) {
            return this.handleApiResponse(this._request(url, { 
                method: 'PUT', 
                body: JSON.stringify(data) 
            }));
        }

        static async delete(url) {
            return this.handleApiResponse(this._request(url, { method: 'DELETE' }));
        }

        static async patch(url, data) {
            return this.handleApiResponse(this._request(url, { 
                method: 'PATCH', 
                body: JSON.stringify(data) 
            }));
        }
    }

    static Utils = class {
        static debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        static formatDate(date, format = 'dd/MM/YYYY') {
            const d = new Date(date);
            if(isNaN(d.getTime())) return ''; // Invalid date

            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('dd', day);
        }

        static isEmpty(value) {
            return value === null || 
                   value === undefined || 
                   value === '' || 
                   (Array.isArray(value) && value.length === 0) ||
                   (typeof value === 'object' && Object.keys(value).length === 0);
        }
    };
}

// Export singleton instance
const appCore = new AppCore();
const { Http, Utils } = AppCore;