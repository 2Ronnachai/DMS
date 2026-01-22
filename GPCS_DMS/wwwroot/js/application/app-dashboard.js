class AppDashboard{
    constructor(){
        this.container = document.getElementById('application-list-container');
        this.endpoints = {
            application:{
                get: `applications/dashboard`
            },
            applicationTypes:{
                lookup: `applicationTypes/lookups`,
            }
        }
    }

    async init(){
        // Load application types for create new application button
        this.loadApplicationTypes().then(() => {
            this.renderApplicationTypeButtons();
        });

        this.loadDashboardData().then(() => {
            this.render();
        });
    }

    // Load ApplicationType dashboard data from server
    // Create button to create application with applicationType and not id
    async loadApplicationTypes(){
        try{
            const response = await AppCore.Http.get(this.endpoints.applicationTypes.lookup);
            if(response && response.success){
                this.applicationTypes = response.data;
            }else{
                throw new Error('Failed to load application types from server.');
            }
        }catch(error){
            console.error('Failed to load application types:', error);
        }
    }

    renderApplicationTypeButtons(){
        const container = document.getElementById('create-application-buttons-container');
        if(this.applicationTypes && this.applicationTypes.length > 0){
            this.applicationTypes.forEach(type => {
                const button = document.createElement('a');
                button.className = 'btn btn-primary m-1';
                button.href = `${window.APP_CONFIG?.host}Application/SetApplicationType?applicationType=${type.name}`;
                button.innerText = `New ${type.displayName}`;
                container.appendChild(button);
            });
        }
    }

    async loadDashboardData(){
        try{
            const response = await AppCore.Http.get(this.endpoints.application.get);
            if(response && response.success){
                this.dashboardData = response.data;
            }else{
                throw new Error('Failed to load dashboard data from server.');
            }
        }catch(error){
            console.error('Failed to load dashboard data:', error);
        }
    }

    // Create sample application dxList and click to open application with <a asp-controller="Application" asp-action="SetApplicationType" asp-route-applicationType="NewMaterialsItems" asp-route-id="3">link</a>
    // data = {applicationType: string, id: number}
    render(){
        // Render application list
        if(this.dashboardData &&  this.dashboardData.length > 0){
            this.container.innerHTML = '';
            this.dashboardData.forEach(data => {
                const appItem = document.createElement('div');
                appItem.className = 'application-item';
                appItem.innerHTML = `
                    <p class="application-number">${data.applicationNumber}</p>
                    <a class="application-link" href="${window.APP_CONFIG?.host}Application/SetApplicationType?applicationType=${data.applicationType}&id=${data.id}">Open Application</a>
                `;
                this.container.appendChild(appItem);
            });
        }
    }
}