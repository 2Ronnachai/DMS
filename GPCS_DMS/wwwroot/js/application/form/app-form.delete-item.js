class DeleteItemForm{
    constructor(appForm, container, applicationData = null) {
        this.appForm = appForm;
        this.container = container;
        this.data = applicationData;

        this.formInstance = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="delete-item-form">
                <h3>Delete Item Requisition Form</h3>
                <!-- Form fields for deleting item requisition go here -->
            </div>
        `;
    }

    get(){
        if(this.formInstance){
            return this.formInstance.option('formData');
        }
    }

    set(data){
        if(this.formInstance){
            this.formInstance.option('formData', data);
        }
    }

    reset(){
        if(this.formInstance){
            this.formInstance.reset();
        }
    }

    validate(){
        if(this.formInstance){
            return this.formInstance.validate();
        }
    }
}