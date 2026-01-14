class AppButtonHandler {
    constructor(appMain) {
        this.appMain = appMain;
        this.http = appMain.http;
        this.dialog = appMain.dialog;
        this.loading = appMain.loading;
        this.notification = appMain.notification;
    }

    async save(){
        // Confirm data => Create or Update application not validated
        const confirmed = await this.dialog.confirm({
            title: 'Save Changes',
            message: 'Do you want to save the changes?',
            type: 'confirm'
        });

        if(!confirmed) return false;
        const loadingId = this.loading.show('Saving changes...');

        try{
            this.appMain.actionButtons.setEnabled(false);
            let formData = null;
            let response = null;

            // Not Validated
            if(this.appMain.applicationId){
                // Update existing application

            }else{
                // Create new application
                formData = this._getPrepareCreateWithApplicationType();

                if(!formData){
                    throw new Error('Failed to prepare data for creating.');
                }

                this._logFormData(formData);

                response = await this.http.postFormData(
                    this.appMain.endpoints.applications.save,
                    formData
                );
            }

            if(!response || !response.success){
                const errorMessage = response?.message || 'Unknown error from server.';
                const errors = response?.errors || [];
                
                // Show detailed errors if available
                if(errors.length > 0){
                    this.dialog.alert({
                        title: 'Save Error',
                        message: `${errorMessage}\n\n${errors.join('\n')}`,
                        type: 'danger'
                    });
                } else {
                    this.notification.error('Failed to save changes: ' + errorMessage);
                }
                
                return false;
            }

            this.notification.success('Changes saved successfully.');

            // Optional: redirect or update UI with new data
            if(response.data && response.data.id && !this.appMain.applicationId){
                // New application created - optionally redirect
                // window.location.href = `/application/${response.data.id}`;
                console.log('New application created:', response.data);
            }
            return true;
        }catch(error){
            this.notification.error('Failed to save changes: ' + error.message);
            console.error('Save error:', error);
            return false;
        }finally{
            this.loading.hide(loadingId);
            this.appMain.actionButtons.setEnabled(true);
        }
    }

    async submit(){
        const comment = await this.dialog.prompt({
            title: 'Submit Application',
            message: 'Are you sure you want to submit the application?',
            placeholder: 'Enter your comments (optional)',
            type: 'confirm',
            required: false
        });

        if(comment === null) return; // User cancelled

        // Validate header and grid data before submission
        const isHeaderValid = await this.appMain.header.validate();
        const isGridValid = await this.appMain.grid.validate();
        console.log('Header validation result:', isHeaderValid);
        if(!isHeaderValid.isValid){
            if(isHeaderValid.brokenRules && isHeaderValid.brokenRules.length > 0){
                const errorMessage = isHeaderValid.brokenRules[0].message || 'Header validation failed.';
                this.notification.error(errorMessage);
            }else{
                this.notification.error(`${isHeaderValid.message}`);
            }
            return;
        }

        // Check grid validation
        if (!isGridValid.isValid) {
            if (isGridValid.brokenRules && isGridValid.brokenRules.length > 0) {
                const errorMessage = isGridValid.brokenRules[0].message;
                this.notification.error(errorMessage);
            } else {
                this.notification.error(`${isGridValid.message}`);
            }
            return;
        }

        // Confirm data => Create or Update application
        this.notification.info('Submit action triggered.');
    }

    async approve(){
        // Confirm data only
        this.notification.info('Approve action triggered.');
    }

    async reject(){
        // Reject with comment
        this.notification.info('Reject action triggered.');
    }

    async return(){
        // Return with comment
        this.notification.info('Return action triggered.');
    }

    async cancel(){
        // Confirm cancel
        this.notification.info('Cancel action triggered.');
    }

    async back(){
        // Navigate back to previous page
        this.notification.info('Back action triggered.');
    }

    _getPrepareCreateWithApplicationType(){
        switch(this.appMain.applicationType.toLowerCase()){
            case 'newmaterialsitems':
                return this.prepareCreateNewMaterialItem();
            default:
                this.notification.warning('Prepare action not defined for application type: ' + this.appMain.applicationType);
                return;
        }
    }

    _getPrepareUpdateWithApplicationType(){
        console.log('Prepare Update action for application type:', this.appMain.applicationType);
        switch(this.appMain.applicationType.toLowerCase()){
            case 'newmaterialsitems':
                return this.prepareUpdateNewMaterialItem();
            default:
                this.notification.warning('Prepare action not defined for application type: ' + this.appMain.applicationType);
                return;
        }
    }
    
    prepareCreateNewMaterialItem(){
        console.log('Prepare New Material Item action triggered.');
        const headerData = this.appMain.header.get();
        const gridData = this.appMain.grid.get();

        console.log('Header Data:', headerData);
        console.log('Grid Data:', gridData);

        var formData = new FormData();
        // Application Model 
        formData.append('applicationType', headerData.applicationType);
        formData.append('supplierCode', headerData.supplierCode || '');
        formData.append('supplierName', headerData.supplierName || '');

        // Add Departmemt and Requester
        if(headerData.department){
            formData.append('department', headerData.department);
        }

        if(headerData.requester){
            formData.append('requester', headerData.requester);
        }

        // Add Dates and Urgent Flag
        formData.append('effectiveDate', new Date(headerData.effectiveDate).toISOString());
        formData.append('isUrgent', headerData.isUrgent);

        // Add Remark
        if(headerData.remark){
            formData.append('remark', headerData.remark);
        }

        // Quotation Url
        formData.append('quotationUrl', headerData.quotationUrl || '');

        // Add Files Attachments
        if (headerData.newAttachments && headerData.newAttachments.length > 0) {
            headerData.newAttachments.forEach((file, index) => {
                if (file instanceof File) {
                    formData.append(`FileAttachments`, file);
                }
            });
        }

        this._logFormData(formData);

        if(gridData && gridData.length > 0){
            this._gridDataToFormData(gridData, formData);
        }
        return formData;
    }

    prepareUpdateNewMaterialItem(){
        console.log('Prepare Update New Material Item action triggered.');
        const headerData = this.appMain.header.get();
    }

    _gridDataToFormData(gridData, formData){
        gridData.forEach((material, materialIndex) => {
            // Material Properties
            formData.append(`materials[${materialIndex}].categoryId`, material.categoryId);
            formData.append(`materials[${materialIndex}].materialTypeId`, material.materialTypeId);
            formData.append(`materials[${materialIndex}].materialDescription`, material.materialDescription || '');
            formData.append(`materials[${materialIndex}].materialUnit`, material.materialUnit || '');
            formData.append(`materials[${materialIndex}].materialUnitPrice`, material.materialUnitPrice || 0);
            formData.append(`materials[${materialIndex}].minimunOrder`, material.minimunOrder || 1);
            formData.append(`materials[${materialIndex}].costCenter`, material.costCenter || '');

            if(material.code){
                formData.append(`materials[${materialIndex}].code`, material.code);
            }

            // Nested Item Properties
            if(material.item){
                const item = material.item;
                const itemIndex =0; // Single item per material in this context

                formData.append(`materials[${materialIndex}].items[${itemIndex}].itemDescription`, item.itemDescription || '');
                formData.append(`materials[${materialIndex}].items[${itemIndex}].itemUnit`, item.itemUnit);
                formData.append(`materials[${materialIndex}].items[${itemIndex}].itemUnitPrice`, item.itemUnitPrice);
                formData.append(`materials[${materialIndex}].items[${itemIndex}].moq`, item.moq || 1);
                formData.append(`materials[${materialIndex}].items[${itemIndex}].lotSize`, item.lotSize || 1);
                formData.append(`materials[${materialIndex}].items[${itemIndex}].currency`, item.currency);
                formData.append(`materials[${materialIndex}].items[${itemIndex}].conversionRate`, item.conversionRate || 1);
                formData.append(`materials[${materialIndex}].items[${itemIndex}].leadTime`, item.leadTime || 1);
                formData.append(`materials[${materialIndex}].items[${itemIndex}].quotationExpiryDate`, new Date(item.quotationExpiryDate).toISOString());
                formData.append(`materials[${materialIndex}].items[${itemIndex}].groupOfGoods`, item.groupOfGoods || '');

                if(item.code){
                    formData.append(`materials[${materialIndex}].items[${itemIndex}].code`, item.code);
                }
            }
        });
    }

    // Helpers to log FormData content for debugging
    _logFormData(formData) {
        console.log('FormData contents:');
        for (let pair of formData.entries()) {
            console.log(`${pair[0]}: ${pair[1]}`);
        }
    }
}