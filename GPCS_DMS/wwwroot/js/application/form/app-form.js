class AppForm{
    constructor(appMain, applicationData = null) {
        this.appMain = appMain;
        this.data = applicationData;
        this.container = document.getElementById('formSection');

        this.formInstance = null;
    }

    render(){
        this.formInstance = this._createForm();
        this.formInstance.render();
    }

    update(data){
        this.data = data;
        if(this.formInstance){
            this.formInstance.update(data);
        }
    }

    _createForm(){
        const formMap = {
            'newmaterialsitems': NewMaterialItemsForm,
            'newitem': NewItemForm,
            'edititem': EditItemForm,
            'deleteitem': DeleteItemForm
        };
        
        this._renderHeader();
        const FormClass = formMap[this.appMain.applicationType.toLowerCase()];
        return new FormClass(this, this.container, this.data);
    }

    _renderHeader(){
        this.container.innerHTML = '';
        const formContainer = document.createElement('div');
        formContainer.className = 'application-form-container';
        formContainer.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <span class="header-application-type"> 
                        ${this.appMain.getApplicationTypeDisplayName()} Requisition Form 
                    </span>
                    <div id="formInstanceContainer"></div>
                </div>
            </div>
        `;
        this.container.append(formContainer);
        this.container = formContainer.querySelector('#formInstanceContainer');
    }

    _renderNewMaterialsItemsForm(){
        // Select Category and Material Type 
        // Material Form And Items Form 
        // Submit Button Handler => itemsSection 
    }

    _renderNewItemsForm(){
        // Filter with Caseding lookup Category and Material Type => Material
        // Select Material to add items
        // MaterialId => Items Form
        // Submit Button Handler => itemsSection
    }

    _renderEditItemsForm(){
        // Filter with Caseding lookup Category and Material Type => Items
        // Select Items to edit
        // ItemsId => Items Form
        // Submit Button Handler => itemsSection
    }

    _renderDeleteItemsForm(){
        // Main filter Section (Application: Supplier => Category => Material Type)
        // Filter with Caseding lookup Category and Material Type => Items
        // Select Items to delete
        // ItemsId => Items Form
        // Submit Button Handler => itemsSection
    }
}