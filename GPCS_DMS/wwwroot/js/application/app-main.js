class AppMain {
    constructor(config = {}){
        // Core dependencies
        this.core = appCore;
        this.http = Http;
        this.utils = Utils;
        this.dialog = appDialog;
        this.loading = appLoading;
        this.notification = appNotification;

        this.applicationType = config.applicationType;
        this.applicationId = config.applicationId;
        this.mode = null; // 'create', 'edit', 'view', 'approve'
        this.userRole = null; // 'applicant', 'approver', 'admin', etc.

        this.permissions = null; // To be loaded based on user role and application type
        this.avaiableActions = []; // To be determined based on permissions and application state

        // Managers
        this.actionHandler = null;
        this.header = new AppHeader(this);

         this.endpoints ={
            loadPermissions: `applications/has-permission/`,
            loadHeaderData: (type) => `applications/workflow/${type}`,
        };

        // Initialize core components
        this._init();

        if(AppMain.instance){
            return AppMain.instance;
        }
        AppMain.instance = this;
    }

    getDateFormat(){
        return 'dd/MM/yyyy';
    }

    async _init(){
        try{
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
        }catch(error){
            this.loading.hide();
            this.notification.error('Failed to initialize application: ' + error.message);
            console.error('Initialization error:', error);
        }
    }

    async _loadInitialData(){
        const promises = [];
        // Load permissions and mode
        promises.push(this._loadPermissions());

        // Load application data if applicationId is provided
        promises.push(this._loadApplicationData());

        // // Load Master data (suppliers ,categories, etc.)
        // promises.push(this._loadMasterData());

        await Promise.all(promises);
    }

    async _loadPermissions(){
        try{
            const response = await this.http.get(this.endpoints.loadPermissions + `${this.applicationId || ''}`);
            if(response && response.success){
                this.permissions = response.data;
                // Determine mode and available actions based on permissions
                this.mode = this.permissions.mode; // e.g., 'create', 'edit', 'view', 'approve'
                this.avaiableActions = this.permissions.availableActions; // e.g., ['save', 'submit', 'approve']
                console.log('Permissions loaded:', this.permissions);
            }else{
                throw new Error('Failed to load permissions from server.');
            }

        }catch(error){
            console.error('Failed to load permissions:', error);
            // Default to no permissions
            this.mode = 'view';
            this.avaiableActions = [];
        }
    }

    async _loadApplicationData(){
        if(this.applicationType && !this.applicationId){
            try{
                const response = await this.http.get(this.endpoints.loadHeaderData(this.applicationType));
                if(response && response.success){
                    this.applicationData = response.data ? response.data : response;
                    this.header.setData(this.applicationData);
                    console.log('Application data loaded:', this.applicationData);
                }else{
                    throw new Error('Failed to load application data from server.');
                }
            }catch(error){
                console.error('Failed to load application data:', error);
            }
        }else if(this.applicationId && this.applicationType){
            // Load existing application data for edit/view/approve modes
        }else{
            // Show default header for new application and change mode to view
        }
    }

    async _initializeModules(){
        // Initialize action handler
        this.actionHandler = new AppButtonHandler(this);

        // Initialize action buttons
        this.actionButtons = new AppButton(this);
        this.actionButtons.render();
    }

    async reload(){
        await this._loadPermissions();
        this.actionButtons.update();
    }
}