class AppMain {
    constructor(config = {}) {
        // Core dependencies
        this.core = appCore;
        this.http = Http;
        this.utils = Utils;
        this.dialog = appDialog;
        this.loading = appLoading;
        this.notification = appNotification;

        // Application configuration
        this.applicationType = config.applicationType;
        this.applicationId = config.applicationId;

        // Application state
        this.mode = null; // 'create', 'edit', 'view', 'approve'
        this.avaiableActions = []; // To be determined based on permissions and application state

        // Managers
        this.form = null;
        this.grid = null;
        this.formComponents = null;
        this.header = null;
        this.workflow = null;
        this.actionHandler = null;
        this.actionButtons = null;

        // Application data
        this.permissions = null; // To be loaded based on user role and application type
        this.applicationData = null;

        // API Endpoints
        this.endpoints = {
            loadPermissions: `applications/has-permission/`,
            loadHeaderData: (type) => `applications/workflow/${type}`,
            lookups: {
                units: 'units/lookups/',
                suppliers: 'suppliers/lookups/',
                category: {
                    purchaser: 'categories/lookups-purchaser/',
                    supplier: (supplierCode) => `categories/lookups-supplier?supplierCode=${supplierCode}`
                },
                exchangeRates: 'exchangerates/lookups/',
                groupOfGoods: 'groupofgoods/lookups/',
                materialTypes: (categoryId) => categoryId ? `materialtypes/lookups?categoryId=${categoryId}` : 'materialtypes/lookups/',
                materialTypesWithoutSupplier: (categoryId, supplierCode) => `materialtypes/lookups-without-supplier?categoryId=${categoryId}&supplierCode=${supplierCode}`,
                supplierPurchasers: 'supplierPurchasers/supplier-purchaser/',
                materials: (categoryId, materialTypeId) => `dataMaterials/filter/with-category-and-type?categoryId=${categoryId}&materialTypeId=${materialTypeId}`,
                dataItems: (filter) => `dataItems/filter?${filter}`
            },
            applications: {
                save: (id) => id ? `applications/${id}/save/` : 'applications/save/',
                submit: (id) => id ? `applications/${id}/submit/` : 'applications/submit/',
                approve: (id) => `applications/${id}/approve/`,
                reject: (id) => `applications/${id}/reject/`,
                return: (id) => `applications/${id}/return/`,
                cancel: (id) => `applications/${id}/cancel/`
            },
            fileAttachments: {
                download: (id) => `file-attachments/${id}/download/`,
                preview: (id) => `file-attachments/${id}/preview/`
            }
        };

        // Initialize core components
        this._init();

        if (AppMain.instance) {
            return AppMain.instance;
        }
        AppMain.instance = this;
    }

    getDateFormat() {
        return 'dd/MM/yyyy';
    }

    async _init() {
        try {
            // Show initial loading
            const loadingId = this.loading.show('Initializing application...');

            // Load initial data
            await this._loadInitialData();

            // Initialize modules
            await this._initializeModules();

            // // Set up event listeners
            // this._setupEventListeners();

            // // Setup auto-save (optional)
            // if(this.mode !== 'view'){
            //     this._setupAutoSave();
            // }

            // // Setup before unload warning for unsaved changes
            // this._setupBeforeUnload();

            // Hide loading
            this.loading.hide();

            this.notification.success('Application initialized successfully.');
        } catch (error) {
            this.loading.hide();
            this.notification.error('Failed to initialize application: ' + error.message);
            console.error('Initialization error:', error);
        }
    }

    async _loadInitialData() {
        const promises = [];
        // Load permissions and mode
        promises.push(this._loadPermissions());

        // Load application data if applicationId is provided
        promises.push(this._loadApplicationData());

        // // Load Master data (suppliers ,categories, etc.)
        // promises.push(this._loadMasterData());

        await Promise.all(promises);
    }

    async _loadPermissions() {
        try {
            const response = await this.http.get(this.endpoints.loadPermissions + `${this.applicationId || ''}`);
            if (response && response.success) {
                this.permissions = response.data;
                this._determineModeAndActions();
                console.log('Permissions loaded:', this.permissions);
            } else {
                throw new Error('Failed to load permissions from server.');
            }

        } catch (error) {
            console.error('Failed to load permissions:', error);
            // Default to no permissions
            this.mode = 'view';
            this.avaiableActions = [];
        }
    }

    _determineModeAndActions() {
        // Logic to determine mode and available actions based on permissions
        this.mode = this.permissions.mode; // e.g., 'create', 'edit', 'view', 'approve'
        this.avaiableActions = this.permissions.availableActions; // e.g., ['save', 'submit', 'approve']
    }

    async _loadApplicationData() {
        if (this.applicationType && !this.applicationId) {
            try {
                const response = await this.http.get(this.endpoints.loadHeaderData(this.applicationType));
                if (response && response.success) {
                    this.applicationData = response.data ? response.data : response;
                } else {
                    throw new Error('Failed to load application data from server.');
                }
            } catch (error) {
                console.error('Failed to load application data:', error);
            }
        } else if (this.applicationId && this.applicationType) {
            try {
                const response = await this.http.get(this.endpoints.loadHeaderData(this.applicationType) + `/${this.applicationId}`);
                if (response && response.success) {
                    this.applicationData = response.data ? response.data : response;
                } else {
                    throw new Error('Failed to load application data from server.');
                }
            } catch (error) {
                console.error('Failed to load application data:', error);
            }
        } else {
            // Show default header for new application and change mode to view
        }
    }

    async _initializeModules() {
        // Initialize action handler
        this.actionHandler = new AppButtonHandler(this);
        this.formComponents = new AppFormComponents(this);

        // Initialize action buttons
        this.actionButtons = new AppButton(this);
        this.actionButtons.render();

        // Initialize header module
        this.header = new AppHeader(this, this.applicationData);
        await this.header.render();

        // Initialize form module
        // Only Create mode and Edit mode require form initialization
        if (this.mode === 'create' || this.mode === 'edit') {
            this.form = new AppForm(this, this.applicationData);
            await this.form.render();
        }

        this.grid = new AppGrid(this, this.applicationData);
        await this.grid.render();

        // Initialize workflow module
        this.workflow = new AppWorkflow(this, this.applicationData);
        this.workflow.render();
    }

    async reload() {
        try {
            const loadingId = this.loading.show('Reloading...');
            await this._loadInitialData();

            this.actionButtons.update();
            this.header.update(this.applicationData);
            this.workflow.update(this.applicationData);

            this.loading.hide(loadingId);
            this.notification.success('Reloaded successfully.');
        } catch (error) {
            this.loading.hide();
            this.notification.error('Reload failed: ' + error.message);
        }
    }

    getApplicationTypeDisplayName() {
        const typeMap = {
            'newmaterialsitems': 'New Materials & Items',
            'newitems': 'New Item',
            'edititems': 'Edit Item',
            'deleteitems': 'Delete Item'
        };
        return typeMap[this.applicationType.toLowerCase()] || 'Application';
    }

    async onSupplierChange(supplier) {
        console.log('Supplier changed to:', supplier);

        // Handle supplier change logic here
        if (this.form && typeof this.form.onSupplierChange === 'function' &&
            this.applicationType.toLowerCase() === 'edititems'
        ) {
            this.grid.reset();
            await this.form.onSupplierChange(supplier);
        }

        // Handle supplier change logic here
        if (this.applicationType.toLowerCase() === 'newitems') {
            console.log('Notifying New Item Form of supplier change.');
        }
    }

    onSubmitNewMaterialsItems(data) {
        // Handle submission logic for New Materials & Items
        // Add to datagrid in items section
        this.grid.addItems([data]);
    }

    onSubmitNewItems(data) {
        // Handle submission logic for New Item
        // Add to datagrid in items section
        this.grid.addItems([data]);
    }

    onSubmitEditItems(data) {
        // Handle submission logic for Edit Item
        // Update datagrid in items section
        this.grid.addItems(data);
    }

    onSubmitDeleteItem(data) {
        // Handle submission logic for Delete Item
        // Update datagrid in items section
        console.log('Submitted Delete Item:', data);
    }

    isDataChanged() {
        let isChanged = false;
        if (this.header) {
            isChanged = this.header.isDataChanged();
        }

        if (!isChanged && this.grid) {
            isChanged = this.grid.isDataChanged();
        }

        return isChanged;
    }
}