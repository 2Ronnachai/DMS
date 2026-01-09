class NewItemForm{
    constructor(appForm, container, data = null) {
        this.appForm = appForm;
        this.container = container;
        this.data = data;

        this.formInstance = null;
    }
    
    render() {
        this.container.innerHTML = `
            <div class="new-item-form">
                <h3>New Item Requisition Form</h3>
                <!-- Form fields for new item requisition go here -->
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