class AppMain {
    constructor(config = {}){
        if(AppMain.instance){
            return AppMain.instance;
        }

        AppMain.instance = this;

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

        // Initialize core components
        this._init();
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
            const response = {
                success: true,
                data: {
                    mode: 'create',
                    availableActions: ['save', 'submit','back', 'cancel', 'return', 'approve', 'reject']
                },
                message: ''
            };
            // Example: Fetch permissions from server
            // const response = await this.http.get(`/api/permissions?applicationType=${this.applicationType}&userRole=${this.userRole}`);
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
                const response = {
                    success: true,
                    data: {
                        documentType: 'Requisition',
                        documentNumber: 'REQ-2024-0001',
                        documentDate: '2024-06-15',
                        requestor: 'John Doe',
                        department: 'Finance',
                        createdDate: '2024-06-10T14:30:00',
                        status: 'Draft',
                        isUrgent:true,
                    },
                    message: ''
                };
                // Example: Fetch application data from server
                // const response = await this.http.get(`/api/applications/${this.applicationType}/${this.applicationId}`);
                if(response && response.success){
                    this.applicationData = response.data;
                    this.header.setData(this.applicationData);
                    console.log('Application data loaded:', this.applicationData);
                }else{
                    throw new Error('Failed to load application data from server.');
                }
            }catch(error){
                console.error('Failed to load application data:', error);
            }
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