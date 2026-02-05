class GridCustomStore {
    #store;
    #endpoint;
    #keyField;
    #onBeforeAction;
    #onAfterAction;
    #onError;

    constructor({
        endpoint,
        keyField = "id",
        parameters = {},
        onBeforeAction,
        onAfterAction,
        onError
    }) {
        if (!endpoint) {
            throw new Error("GridCustomStore: endpoint is required");
        }

        this.#endpoint = endpoint;
        this.#keyField = keyField;
        this.#onBeforeAction = onBeforeAction;
        this.#onAfterAction = onAfterAction;
        this.#onError = onError;

        this.#store = new DevExpress.data.CustomStore({
            key: keyField,
            
            load: (loadOptions) => {
                return this.#load(loadOptions, parameters);
            },
            
            insert: (values) => {
                return this.#insert(values);
            },
            
            update: (key, values) => {
                return this.#update(key, values);
            },
            
            remove: (key) => {
                return this.#remove(key);
            }
        });
    }

    async #load(loadOptions, extraParams = {}) {
        try {
            this.#onBeforeAction?.("load", loadOptions);

            // Build query parameters
            const params = {
                ...extraParams
            };

            loadOptions.requireTotalCount = true;

            // DevExtreme load options
            const skip = loadOptions.skip || 0;
            const take = loadOptions.take || 20;

            // DevExtreme load options
            if (loadOptions.skip !== undefined) {
                params.skip = loadOptions.skip;
            }
            if (loadOptions.take !== undefined) {
                params.take = loadOptions.take;
            }
            if (loadOptions.sort) {
                params.sort = JSON.stringify(loadOptions.sort);
            }
            if (loadOptions.filter) {
                params.filter = JSON.stringify(loadOptions.filter);
            }
            if (loadOptions.group) {
                params.group = JSON.stringify(loadOptions.group);
            }
            if (loadOptions.searchExpr && loadOptions.searchValue) {
                params.searchExpr = JSON.stringify(loadOptions.searchExpr);
                params.searchValue = loadOptions.searchValue;
            }

            if(loadOptions.requireTotalCount){
                params.requireTotalCount = true;
            }

            // Construct URL with query string
            const queryString = new URLSearchParams(params).toString();
            const url = `${this.#endpoint}?${queryString}`;

            // Call API
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            let data, totalCount;

            if (Array.isArray(result)) {
                data = result;
                totalCount = result.length;
            } else if (result.data && Array.isArray(result.data)) {
                data = result.data;
                totalCount = result.totalCount !== undefined ? result.totalCount : data.length;
            } else {
                console.error('Invalid response format:', result);
                throw new Error('Invalid response format from server');
            }

            data = data.map((item, index) => ({
                ...item,
                __rowNumber: skip + index + 1
            }));

            // Update global total count
            window.gridTotalCount = totalCount;

            this.#onAfterAction?.("load", { data, totalCount });

            // Return in the format required by DevExtreme
            return {
                data: data,
                totalCount: totalCount
            };

        } catch (error) {
            console.error('Load Error:', error);
            this.#onError?.(error, "load");
            throw error;
        }
    }

    async #insert(values) {
        try {
            this.#onBeforeAction?.("insert", values);

            const response = await fetch(this.#endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(values)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            this.#onAfterAction?.("insert", result);

            return result;

        } catch (error) {
            console.error('Insert Error:', error);
            this.#onError?.(error, "insert");
            throw error;
        }
    }

    async #update(key, values) {
        try {
            this.#onBeforeAction?.("update", { key, values });

            const response = await fetch(`${this.#endpoint}/${key}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(values)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Update Response:', result);

            this.#onAfterAction?.("update", result);

            return result;

        } catch (error) {
            console.error('Update Error:', error);
            this.#onError?.(error, "update");
            throw error;
        }
    }

    async #remove(key) {
        try {
            this.#onBeforeAction?.("remove", key);

            const response = await fetch(`${this.#endpoint}/${key}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.#onAfterAction?.("remove", key);

        } catch (error) {
            console.error('Remove Error:', error);
            this.#onError?.(error, "remove");
            throw error;
        }
    }

    getStore() {
        return this.#store;
    }
}

// Global export
window.GridCustomStore = GridCustomStore;
