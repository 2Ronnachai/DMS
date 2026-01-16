class AppButtonHandler {
    constructor(appMain) {
        this.appMain = appMain;
        this.http = appMain.http;
        this.dialog = appMain.dialog;
        this.loading = appMain.loading;
        this.notification = appMain.notification;
    }

    async save() {
        // Confirm data => Create or Update application not validated
        const comment = await this.dialog.prompt({
            title: 'Save Application',
            message: 'Are you sure you want to save the application?',
            placeholder: 'Enter your comments (optional)',
            type: 'confirm',
            required: false
        });

        if (comment === null) return;

        const loadingId = this.loading.show('Saving changes...');

        try {
            this.appMain.actionButtons.setEnabled(false);
            let formData = null;
            let response = null;

            // Not Validated
            if (this.appMain.applicationId) {
                // Update existing application
                formData = this._getPrepareUpdateWithApplicationType();
                if (!formData) {
                    throw new Error('Failed to prepare data for updating.');
                }

                this._logFormData(formData);

                response = await this.http.putFormData(
                    this.appMain.endpoints.applications.save + `${this.appMain.applicationId}` + (comment ? `?comment=${encodeURIComponent(comment)}` : ''),
                    formData
                );

            } else {
                // Create new application
                formData = this._getPrepareCreateWithApplicationType();

                if (!formData) {
                    throw new Error('Failed to prepare data for creating.');
                }

                this._logFormData(formData);

                response = await this.http.postFormData(
                    this.appMain.endpoints.applications.save + (comment ? `?comment=${encodeURIComponent(comment)}` : ''),
                    formData
                );
            }

            if (!response || !response.success) {
                const errorMessage = response?.message || 'Unknown error from server.';
                const errors = response?.errors || [];

                // Show detailed errors if available
                if (errors.length > 0) {
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
            if (response.data && response.data.id && !this.appMain.applicationId) {
                // New application created - optionally redirect
                // window.location.href = `/application/${response.data.id}`;
                console.log('New application created:', response.data);
            }
            return true;
        } catch (error) {
            this.notification.error('Failed to save changes: ' + error.message);
            console.error('Save error:', error);
            return false;
        } finally {
            this.loading.hide(loadingId);
            this.appMain.actionButtons.setEnabled(true);
        }
    }

    async submit() {
        const comment = await this.dialog.prompt({
            title: 'Submit Application',
            message: 'Are you sure you want to submit the application?',
            placeholder: 'Enter your comments (optional)',
            type: 'confirm',
            required: false
        });

        if (comment === null) return; // User cancelled

        // Validate header and grid data before submission
        const isHeaderValid = await this.appMain.header.validate();
        const isGridValid = await this.appMain.grid.validate();

        if (!isHeaderValid.isValid) {
            if (isHeaderValid.brokenRules && isHeaderValid.brokenRules.length > 0) {
                const errorMessage = isHeaderValid.brokenRules[0].message || 'Header validation failed.';
                this.notification.error(errorMessage);
            } else {
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

        let formData = null;
        let response = null;

        if (this.appMain.applicationId) {
            // Update existing application
            formData = this._getPrepareUpdateWithApplicationType();
            if (!formData) {
                this.notification.error('Failed to prepare data for submission.');
                return;
            }
            this._logFormData(formData);

            response = await this.http.putFormData(
                this.appMain.endpoints.applications.submit + `${this.appMain.applicationId}` + (comment ? `?comment=${encodeURIComponent(comment)}` : ''),
                formData
            );
        } else {
            // Create new application
            formData = this._getPrepareCreateWithApplicationType();

            if (!formData) {
                this.notification.error('Failed to prepare data for submission.');
                return;
            }

            this._logFormData(formData);

            response = await this.http.postFormData(
                this.appMain.endpoints.applications.submit,
                formData
            );
        }

        if (!response || !response.success) {
            const errorMessage = response?.message || 'Unknown error from server.';
            const errors = response?.errors || [];
            // Show detailed errors if available
            if (errors.length > 0) {
                this.dialog.alert({
                    title: 'Submit Error',
                    message: `${errorMessage}\n\n${errors.join('\n')}`,
                    type: 'danger'
                });
            } else {
                this.notification.error('Failed to submit application: ' + errorMessage);
            }
        }

        this.notification.success('Application submitted successfully.');

        // Optional: redirect or update UI with new data
        if (response.data && response.data.id && !this.appMain.applicationId) {
            // New application created - optionally redirect
            // window.location.href = `/application/${response.data.id}`;
            console.log('New application created:', response.data);
        }

        // Confirm data => Create or Update application
        this.notification.info('Submit action triggered.');
    }

    async approve() {
        // Confirm data only
        this.notification.info('Approve action triggered.');
    }

    async reject() {
        // Reject with comment
        this.notification.info('Reject action triggered.');
    }

    async return() {
        // Return with comment
        this.notification.info('Return action triggered.');
    }

    async cancel() {
        // Confirm cancel
        this.notification.info('Cancel action triggered.');
    }

    async back() {
        // Navigate back to previous page
        this.notification.info('Back action triggered.');
    }

    _getPrepareCreateWithApplicationType() {
        switch (this.appMain.applicationType.toLowerCase()) {
            case 'newmaterialsitems':
                return this.prepareCreateNewMaterialItem();
            default:
                this.notification.warning('Prepare action not defined for application type: ' + this.appMain.applicationType);
                return;
        }
    }

    _getPrepareUpdateWithApplicationType() {
        switch (this.appMain.applicationType.toLowerCase()) {
            case 'newmaterialsitems':
                return this.prepareUpdateNewMaterialItem();
            default:
                this.notification.warning('Prepare action not defined for application type: ' + this.appMain.applicationType);
                return;
        }
    }

    prepareCreateNewMaterialItem() {
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
        if (headerData.department) {
            formData.append('department', headerData.department);
        }

        if (headerData.requester) {
            formData.append('requester', headerData.requester);
        }

        // Add Dates and Urgent Flag
        formData.append('effectiveDate', new Date(headerData.effectiveDate).toISOString());
        formData.append('isUrgent', headerData.isUrgent);

        // Add Remark
        if (headerData.remark) {
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

        if (gridData && gridData.length > 0) {
            this._gridDataToFormData(gridData, formData);
        }
        return formData;
    }

    prepareUpdateNewMaterialItem() {
        const headerData = this.appMain.header.get();
        const gridData = this.appMain.grid.get();

        console.log('Header Data:', headerData);
        console.log('Grid Data:', gridData);

        var formData = new FormData();
        // Application Model
        formData.append('id', this.appMain.applicationId);
        formData.append('applicationType', headerData.applicationType);
        formData.append('supplierCode', headerData.supplierCode || '');
        formData.append('supplierName', headerData.supplierName || '');

        // Add Departmemt and Requester
        if (headerData.department) {
            formData.append('department', headerData.department);
        }

        if (headerData.requester) {
            formData.append('requester', headerData.requester);
        }

        // Add Dates and Urgent Flag
        formData.append('effectiveDate', new Date(headerData.effectiveDate).toISOString());
        formData.append('isUrgent', headerData.isUrgent);

        // Add Remark
        if (headerData.remark) {
            formData.append('remark', headerData.remark);
        }

        // Quotation Url
        formData.append('quotationUrl', headerData.quotationUrl || '');

        // Add Files Attachments
        if (headerData.newAttachments && headerData.newAttachments.length > 0) {
            headerData.newAttachments.forEach((file, index) => {
                if (file instanceof File) {
                    formData.append(`NewAttachments`, file);
                }
            });
        }

        if(headerData.deletedAttachmentIds && headerData.deletedAttachmentIds.length > 0){
            headerData.deletedAttachmentIds.forEach((id) => {
                formData.append('DeletedAttachmentIds', id);
            });
        }

        if (gridData && gridData.length > 0) {
            this._gridDataToFormData(gridData, formData);
        }
        return formData;
    }

    _gridDataToFormData(gridData, formData) {
        gridData.forEach((material, materialIndex) => {
            if(material.id){
                formData.append(`materials[${materialIndex}].id`, material.id || '');
            }
            // Material Properties
            formData.append(`materials[${materialIndex}].categoryId`, material.categoryId);
            formData.append(`materials[${materialIndex}].materialTypeId`, material.materialTypeId);
            formData.append(`materials[${materialIndex}].materialDescription`, material.materialDescription || '');
            formData.append(`materials[${materialIndex}].materialUnit`, material.materialUnit || '');
            formData.append(`materials[${materialIndex}].materialUnitPrice`, material.materialUnitPrice || 0);
            formData.append(`materials[${materialIndex}].minimumOrder`, material.minimumOrder || 1);
            formData.append(`materials[${materialIndex}].costCenter`, material.costCenter || '');

            if(material.runningNumber){
                formData.append(`materials[${materialIndex}].runningNumber`, material.runningNumber || '');
            }

            if (material.code) {
                formData.append(`materials[${materialIndex}].code`, material.code);
            }

            // Nested Item Properties
            if (material.item) {
                const item = material.item;

                if(item.id){
                    formData.append(`materials[${materialIndex}].item.id`, item.id || '');
                }

                formData.append(`materials[${materialIndex}].item.itemDescription`, item.itemDescription || '');
                formData.append(`materials[${materialIndex}].item.itemUnit`, item.itemUnit);
                formData.append(`materials[${materialIndex}].item.itemUnitPrice`, item.itemUnitPrice);
                formData.append(`materials[${materialIndex}].item.moq`, item.moq || 1);
                formData.append(`materials[${materialIndex}].item.lotSize`, item.lotSize || 1);
                formData.append(`materials[${materialIndex}].item.currency`, item.currency);
                formData.append(`materials[${materialIndex}].item.conversionRate`, item.conversionRate || 1);
                formData.append(`materials[${materialIndex}].item.leadTime`, item.leadTime || 1);
                formData.append(`materials[${materialIndex}].item.quotationExpiryDate`, new Date(item.quotationExpiryDate).toISOString());
                formData.append(`materials[${materialIndex}].item.groupOfGoods`, item.groupOfGoods || '');

                if (item.runningNumber) {
                    formData.append(`materials[${materialIndex}].item.runningNumber`, item.runningNumber || '');
                }

                if (item.code) {
                    formData.append(`materials[${materialIndex}].item.code`, item.code);
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