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
                    this.appMain.endpoints.applications.save(this.appMain.applicationId) + (comment ? `?comment=${encodeURIComponent(comment)}` : ''),
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
                    this.appMain.endpoints.applications.save() + (comment ? `?comment=${encodeURIComponent(comment)}` : ''),
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

            // Optional: redirect or update UI with new data
            if (response.data && response.data.id) {
                this.notification.success('Changes saved successfully.');
                this.appMain.applicationId = response.data.id;
                this.appMain.mode = 'edit';
                await this.appMain._initializeModules();
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

        const loadingId = this.loading.show('Submitting application...');

        try {
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
                    this.appMain.endpoints.applications.submit(this.appMain.applicationId) + (comment ? `?comment=${encodeURIComponent(comment)}` : ''),
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
                    this.appMain.endpoints.applications.submit(),
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

            // Optional: redirect or update UI with new data
            if (response.data && response.data.id) {
                this.notification.success(`Application submitted no. ${response.data.applicationNumber} successfully.`);
                this.nevigateToHomePage();
            }
        } catch (error) {
            console.error('Submit error:', error);
            this.notification.error('Failed to submit application: ' + error.message);
        } finally {
            this.loading.hide(loadingId);
        }
    }

    async approve() {
        // Confirm data only not require comment
        const comment = await this.dialog.prompt({
            title: 'Approve Application',
            message: 'Are you sure you want to approve the application?',
            placeholder: 'Enter your comments (optional)',
            type: 'confirm',
            required: false
        });

        if (comment === null) return; // User cancelled
        const loadingId = this.loading.show('Approving application...');
        try {
            const response = await this.http.put(
                this.appMain.endpoints.applications.approve(this.appMain.applicationId) + (comment ? `?comment=${encodeURIComponent(comment)}` : '')
            );

            if (!response || !response.success) {
                const errorMessage = response?.message || 'Unknown error from server.';
                const errors = response?.errors || [];
                // Show detailed errors if available
                if (errors.length > 0) {
                    this.dialog.alert({
                        title: 'Approve Error',
                        message: `${errorMessage}\n\n${errors.join('\n')}`,
                        type: 'danger'
                    });
                } else {
                    this.notification.error('Failed to approve application: ' + errorMessage);
                }
            }

            this.notification.success(`Application no. ${this.appMain.applicationData.applicationNumber} approved successfully.`);
            this.nevigateToHomePage();
        } catch (error) {
            console.error('Approve error:', error);
            this.notification.error('Failed to approve application: ' + error.message);
        } finally {
            this.loading.hide(loadingId);
        }
    }

    async reject() {
        // Reject with comment
        this.notification.info('Reject action triggered.');
    }

    async return() {
        // Return with comment
        const comment = await this.dialog.prompt({
            title: 'Return Application',
            message: `Please provide a reason for returning the application: </br>
               <strong>${this.appMain.applicationData.applicationNumber ? ' ' + this.appMain.applicationData.applicationNumber : ''}</strong>`,
            placeholder: 'Enter your comments here...',
            type: 'confirm',
            required: true
        });

        if (comment === null) return; // User cancelled

        const loadingId = this.loading.show('Returning application...');
        try {
            const response = await this.http.put(
                this.appMain.endpoints.applications.return(this.appMain.applicationId) + `?comment=${encodeURIComponent(comment)}`
            );

            if (!response || !response.success) {
                const errorMessage = response?.message || 'Unknown error from server.';
                const errors = response?.errors || [];
                // Show detailed errors if available
                if (errors.length > 0) {
                    this.dialog.alert({
                        title: 'Return Error',
                        message: `${errorMessage}\n\n${errors.join('\n')}`,
                        type: 'danger'
                    });
                } else {
                    this.notification.error('Failed to return application: ' + errorMessage);
                }
                return;
            }

            this.notification.success(`Application no. ${this.appMain.applicationData.applicationNumber} returned successfully.`);
            this.nevigateToHomePage();

        } catch (error) {
            console.error('Return error:', error);
            this.notification.error('Failed to return application: ' + error.message);
        } finally {
            this.loading.hide(loadingId);
        }

        this.notification.info('Return action triggered.');
    }

    async cancel() {
        // Confirm cancel
        this.notification.info('Cancel action triggered.');
    }

    async back() {
        // Compare this.appMain.applicationId call api check data changed or not with current data
        // If changed, prompt confirm to leave this page or not
        const isDataChanged = this.appMain.isDataChanged();

        if (isDataChanged) {
            const confirmLeave = await this.dialog.confirm({
                title: 'Unsaved Changes',
                message: 'You have unsaved changes. Are you sure you want to leave this page?',
                type: 'confirm'
            });

            if (!confirmLeave) {
                return; // User chose to stay on the page
            }
        }

        this.nevigateToHomePage();
    }

    nevigateToHomePage() {
        // Navigate back to previous page or dashboard => window.APP_CONFIG.host
        window.location.href = window.APP_CONFIG.host;
    }

    _getPrepareCreateWithApplicationType() {
        switch (this.appMain.applicationType.toLowerCase()) {
            case 'newmaterialsitems':
                return this.prepareCreateNewMaterialItem();
            case 'newitems':
                return this.prepareCreateNewMaterialItem();
            case 'edititems':
                return this.prepareCreateNewMaterialItem();
            case 'deleteitems':
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
            case 'newitems':
                return this.prepareUpdateNewMaterialItem();
            case 'edititems':
                return this.prepareUpdateNewMaterialItem();
            case 'deleteitems':
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
        const effectiveDate = this._formatDateTime(headerData.effectiveDate);
        if (effectiveDate !== null) {
            formData.append('effectiveDate', effectiveDate);
        }
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
        const effectiveDate = this._formatDateTime(headerData.effectiveDate);
        if (effectiveDate !== null) {
            formData.append('effectiveDate', effectiveDate);
        }

        formData.append('isUrgent', headerData.isUrgent);

        // Add Remark
        if (headerData.remark) {
            formData.append('remark', headerData.remark);
        }

        // Quotation Url
        formData.append('quotationUrl', headerData.quotationUrl || '');

        // Add Files Attachments
        if (headerData.existingAttachmentIds && headerData.existingAttachmentIds.length > 0) {
            headerData.existingAttachmentIds.forEach((id) => {
                formData.append('existingAttachmentIds', id);
            });
        }

        if (headerData.newAttachments && headerData.newAttachments.length > 0) {
            headerData.newAttachments.forEach((file, index) => {
                if (file instanceof File) {
                    formData.append(`newAttachments`, file);
                }
            });
        }

        if (headerData.deletedAttachmentIds && headerData.deletedAttachmentIds.length > 0) {
            headerData.deletedAttachmentIds.forEach((id) => {
                formData.append('deletedAttachmentIds', id);
            });
        }

        if (gridData && gridData.length > 0) {
            this._gridDataToFormData(gridData, formData);
        }
        return formData;
    }

    _gridDataToFormData(gridData, formData) {
        gridData.forEach((material, materialIndex) => {
            if (material.id) {
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

            if (material.materialRunningNumber) {
                formData.append(`materials[${materialIndex}].materialRunningNumber`, material.materialRunningNumber || '');
            }

            if (material.materialCode) {
                formData.append(`materials[${materialIndex}].materialCode`, material.materialCode);
            }

            // Nested Item Properties
            if (material.item) {
                const item = material.item;

                if (item.id) {
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

                const quotationExpiryDate = this._formatDateTime(item.quotationExpiryDate);
                if (quotationExpiryDate !== null) {
                    formData.append(`materials[${materialIndex}].item.quotationExpiryDate`, quotationExpiryDate);
                }

                formData.append(`materials[${materialIndex}].item.groupOfGoods`, item.groupOfGoods || '');

                if (item.itemRunningNumber) {
                    formData.append(`materials[${materialIndex}].item.itemRunningNumber`, item.itemRunningNumber || '');
                }

                if (item.itemCode) {
                    formData.append(`materials[${materialIndex}].item.itemCode`, item.itemCode);
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

    _formatDateTime(dateValue) {
        if (!dateValue || dateValue === '') return null;

        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

        if (isNaN(date.getTime())) {
            return null;
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        // "2026-01-27T06:12:04"
    }

    _formatDate(dateValue) {
        if (!dateValue || dateValue === '') return null;

        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

        if (isNaN(date.getTime())) {
            return null;
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
        // "2026-01-27"
    }

}