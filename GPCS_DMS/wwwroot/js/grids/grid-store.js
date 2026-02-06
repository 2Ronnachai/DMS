class DxGridStore {
    #config;
    #store;
    #isInitialized = false;
    #lastLoadSkip = 0;

    constructor(config) {
        this.#config = {
            endpoint: config.endpoint,
            keyField: config.keyField || 'id',
            parameters: config.parameters || {},
            callbacks: {
                onBeforeAction: config.onBeforeAction,
                onAfterAction: config.onAfterAction,
                onError: config.onError
            },
            options: {
                timeout: config.timeout || 30000,
                enableLogging: config.enableLogging || false
            }
        }
    }

    async initialize() {
        if (this.#isInitialized) {
            return;
        }

        try{
            // Create Devextreme AspNet Data Store
            this.#store = DevExpress.data.AspNet.createStore({
                key: this.#config.keyField,
                loadUrl: this.#config.endpoint,
                insertUrl: this.#config.endpoint,
                updateUrl: this.#config.endpoint,
                deleteUrl: this.#config.endpoint,

                onBeforeSend: (method, ajaxOptions) => {
                    // Enable CORS with Credentials
                    ajaxOptions.xhrFields = { withCredentials: true };
                    

                    if (method === "load") {
                        const url = new URL(ajaxOptions.url, window.location.origin);
                        let skip = 0;

                        if (ajaxOptions.data && typeof ajaxOptions.data.skip !== 'undefined') {
                            const rawSkip = ajaxOptions.data.skip;
                            skip = typeof rawSkip === 'number' ? rawSkip : parseInt(rawSkip, 10) || 0;
                        } else {
                            const skipParam = url.searchParams.get('skip');
                            skip = skipParam ? parseInt(skipParam, 10) || 0 : 0;
                        }

                        this.#lastLoadSkip = skip;

                        if (this.#config.parameters && Object.keys(this.#config.parameters).length > 0) {
                            Object.keys(this.#config.parameters).forEach(key => {
                                url.searchParams.append(key, this.#config.parameters[key]);
                            });
                        }

                        ajaxOptions.url = url.toString();
                    }

                    // Set timeout
                    if (this.#config.options.timeout) {
                        ajaxOptions.timeout = this.#config.options.timeout;
                    }

                    // Call custom callback
                    if (this.#config.callbacks.onBeforeAction) {
                        this.#config.callbacks.onBeforeAction(method, ajaxOptions);
                    }

                    if (this.#config.options.enableLogging) {
                        console.log('DataStore request:', {
                            method: method,
                            url: ajaxOptions.url,
                            data: ajaxOptions.data
                        });
                    }
                },

                // // Success Handlers (same as old working code)
                onLoaded: (data) => {
                    try {
                        let items = null;

                        if (Array.isArray(data)) {
                            items = data;
                        } else if (data && Array.isArray(data.data)) {
                            items = data.data;
                        }

                        if (items) {
                            const baseSkip = this.#lastLoadSkip || 0;
                            items.forEach((item, index) => {
                                item.__rowNumber = baseSkip + index + 1;
                            });
                        }
                    } catch (e) {
                        console.error('Failed to assign __rowNumber', e);
                    }
                },
                // onInserted: (values, key) => this._handleOperationSuccess('insert', { values, key }),
                // onUpdated: (key, values) => this._handleOperationSuccess('update', { key, values }),
                // onRemoved: (key) => this._handleOperationSuccess('remove', { key }),

                // // Error Handlers (same as old working code)
                // onLoadError: (error) => this._handleOperationError(error, 'load'),
                // onInsertError: (error) => this._handleOperationError(error, 'insert'),
                // onUpdateError: (error) => this._handleOperationError(error, 'update'),
                // onRemoveError: (error) => this._handleOperationError(error, 'remove')
            });

            this.#isInitialized = true;
            return this.#store;
        }catch(error) {
            if(this.#config.callbacks.onError) {
                this.#config.callbacks.onError(error, 'initialize');
            }
            console.error('Failed to initialize DxGridStore:', error);
            throw error;
        }
    }

    _handleOperationSuccess(operation, data) {
        if (this.#config.callbacks.onAfterAction) {
            this.#config.callbacks.onAfterAction(operation, data);
        }
        if (this.#config.options.enableLogging) {
            console.log(`Operation ${operation} succeeded:`, data);
        }
    }

    _handleOperationError(error, operation) {
        if (this.#config.callbacks.onError) {
            this.#config.callbacks.onError(error, operation);
        }
        console.error(`Operation ${operation} failed:`, error);
    }

    async getStore() {
        if (!this.#isInitialized) {
            await this.initialize();
        }
        return this.#store;
    }

    getParameters() {
        return {...this.#config.parameters};
    }

    getEndpoint() {
        return this.#config.endpoint;
    }

    async updateEndpoint(newEndpoint) {
        if (!newEndpoint || typeof newEndpoint !== 'string') {
            console.error('Invalid endpoint provided.');
            return;
        }
        this.#config.endpoint = newEndpoint;
        await this._recreateStore();
    }

    async updateParameters(newParameters) {
        this.#config.parameters = {
            ...this.#config.parameters,
            ...newParameters
        };
        await this._recreateStore();
    }

    async _recreateStore() {
        if (!this.#isInitialized) {
            console.warn('Store is not initialized.');
            return;
        }
        this.#isInitialized = false;
        await this.initialize();
    }

     async clearParameters() {
        this.#config.parameters = {};
        await this._recreateStore();
    }

    dispose() {
        this.#store = null;
        this.#isInitialized = false;
        this.#config = null;
    }

    static async create(config) {
        if (!config?.endpoint || typeof config.endpoint !== 'string') {
            throw new Error('endpoint must be a string');
        }

        const gridInstance = new DxGridStore(config);
        await gridInstance.initialize();
        return gridInstance.getStore();
    }
}

window.DxGridStore = DxGridStore;
