class AppHeader {
    constructor(appMain, applicationData = null) {
        this.appMain = appMain;
        this.data = applicationData;
        this.container = document.getElementById('headerSection');

        this.mode = null; // 'create', 'edit', 'view', 'approve'

        // File attachment management
        this.pendingFiles = []; // For files added but not yet saved
        this.deletedFileIds = []; // For IDs of files marked for deletion
        this.fileListInstance = null;

        this.formInstance = null;

        this.quotationSelector = new AppHeaderPopup(appMain);

        this.isUpdatingFromQuotation = false;
        this.isUpdatingFromSupplier = false;

        this.options = {
            requireAttachment: true,
            showAttachment: true,
            minAttachments: 1,
            maxAttachments: null,
            attachmentLabel: 'File Attachments',
            ...this.options,
        };
    }

    async render() {
        if (!this.container || !this.data) return;

        // Determine render mode based on appMain.mode
        this.mode = (this.appMain.mode === 'create' || this.appMain.mode === 'edit') ? 'form' : 'view';

        this._getOptionsWithApplicationType();

        // Clear container
        this.container.innerHTML = '';
        await this._renderForm();
    }

    _getOptionsWithApplicationType() {
        const appType = this.appMain.applicationType?.toLowerCase();
        if (appType === 'deleteitem') {
            this.options.requireAttachment = false;
            this.options.minAttachments = 0;
            this.options.showAttachment = false;
        }
    }

    _getStatusConfig(status) {
        const statusMap = {
            draft: {
                text: 'Draft',
                icon: 'fas fa-pen-to-square'
            },
            verified: {
                text: 'Verified',
                icon: 'fas fa-user-check'
            },
            approved: {
                text: 'Approved',
                icon: 'fas fa-check-circle'
            },
            waitingeffective: {
                text: 'Waiting',
                icon: 'fas fa-clock'
            },
            completed: {
                text: 'Completed',
                icon: 'fas fa-check-double'
            },
            rejected: {
                text: 'Rejected',
                icon: 'fas fa-times-circle'
            },
            cancelled: {
                text: 'Cancelled',
                icon: 'fas fa-ban'
            },
            returned: {
                text: 'Returned',
                icon: 'fas fa-undo-alt'
            }
        };

        const key = (status || '').toLowerCase();
        return statusMap[key] || statusMap.draft;
    }

    async _renderForm() {
        const suppliers = await this.appMain.formComponents.getSupplierDataSource();

        const formContainer = document.createElement('div');
        formContainer.className = 'header-form-container';
        formContainer.innerHTML = `
            <divl class="card">
                <div class="card-body">
                    <div id="headerFormElements"></div>
                </div>
            </div>
        `;
        this.container.append(formContainer);

        const getEditorOptions = (customOptions = {}) => {
            return {
                stylingMode: this.mode === 'view' ? 'outlined' : 'filled',
                ...customOptions
            };
        };

        const formItems = [
            {
                itemType: 'simple',
                colSpan: 2,
                template: () => {
                    const status = this.data.applicationStatus || 'Draft';
                    const isUrgent = this.data.isUrgent || false;

                    const statusConfig = this._getStatusConfig(status);

                    return $('<div>')
                        .css({
                            marginBottom: '16px'
                        })
                        .html(`
                                <div class="d-flex align-items-center justify-content-between">

                                    <!-- Left -->
                                    <div class="d-flex align-items-center gap-2">

                                        ${isUrgent ? `
                                            <i class="dx-icon dx-icon-clock"
                                            title="Urgent"
                                            style="font-size:18px;color:#616161"></i>
                                        ` : ''}

                                        <div style="
                                            display:flex;
                                            align-items:baseline;
                                            gap:8px;
                                        ">
                                            <span class="header-application-type">
                                                Information Request
                                            </span>

                                            <span style="
                                                font-size:16px;
                                                font-weight:400;
                                                color:#9E9E9E;
                                            ">
                                                ${this.data.applicationNumber || ''}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Status -->
                                    <div style="
                                        display:flex;
                                        align-items:center;
                                        gap:6px;
                                        font-size:13px;
                                        font-weight:500;
                                        color:#424242;
                                    ">
                                        <i class="${statusConfig.icon}" style="font-size:16px"></i>
                                        <span>${statusConfig.text}</span>
                                    </div>

                                </div>
                            `);
                }
            },
            {
                itemType: 'group',
                colCount: 2,
                colSpan: 2,
                items: [
                    // Quotation URL
                    {
                        dataField: 'quotationUrl',
                        label: {
                            text: 'Quotation URL',
                        },
                        editorType: 'dxTextBox',
                        editorOptions: getEditorOptions({
                            placeholder: 'Click browse button to select quotation',
                            readOnly: true,
                            buttons: [{
                                name: 'view',
                                location: 'after',
                                options: {
                                    icon: 'eyeopen',
                                    hint: 'View Quotation',
                                    stylingMode: 'text',
                                    visible: false,
                                    disabled: false,
                                    elementAttr: {
                                        class: 'quotation-action-btn'
                                    },
                                    onClick: () => this._viewQuotation()
                                }
                            }, {
                                name: 'clearQuotation',
                                location: 'after',
                                options: {
                                    icon: 'clear',
                                    hint: 'Clear Quotation',
                                    stylingMode: 'text',
                                    disabled: this.mode === 'view',
                                    visible: false,
                                    elementAttr: {
                                        class: 'quotation-action-btn'
                                    },
                                    onClick: () => {
                                        this.formInstance.updateData('quotationUrl', '');
                                        this._clearQuotation();
                                        this._updateQuotationButtonVisibility();

                                        setTimeout(() => {
                                            this._revalidateForm();
                                        }, 100);
                                    }
                                }
                            }, {
                                name: 'browse',
                                location: 'before',
                                options: {
                                    icon: 'search',
                                    text: 'Browse',
                                    stylingMode: 'text',
                                    disabled: this.mode === 'view',
                                    visible: this.mode !== 'view',
                                    onClick: async () => await this._openQuotationSelector()
                                }
                            }
                            ]
                        }),
                        validationRules: [{
                            type: 'custom',
                            reevaluate: true,
                            validationCallback: (options) => {
                                const hasSupplier = this.formInstance?.getEditor('supplierCode')?.option('value');
                                
                                if (!hasSupplier) {
                                    return true;
                                }
                                
                                const hasQuotation = options.value && options.value.trim() !== '';
                                const hasAttachment = this._getAllFiles().length > 0;
                                
                                return hasQuotation || hasAttachment;
                            },
                            message: 'Please provide quotation URL or attach files'
                        }],

                        colSpan: 2
                    },
                    // Supplier
                    {
                        dataField: 'supplierCode',
                        colSpan: 2,
                        label: {
                            text: 'Supplier',
                        },
                        editorType: 'dxSelectBox',
                        editorOptions: getEditorOptions({
                            dataSource: {
                                store: suppliers || [],
                                paginate: true,
                                pageSize: 20
                            },
                            displayExpr: 'displayName',
                            valueExpr: 'code',
                            placeholder: 'Select Supplier',
                            searchEnabled: true,
                            searchMode: 'contains',
                            searchExpr: ['name', 'code'],
                            readOnly: !!this.data.quotationUrl,
                            onValueChanged: (e) => {
                                if (this.isUpdatingFromQuotation) return;

                                this.isUpdatingFromSupplier = true;

                                const selectedItem = e.component.option('selectedItem');
                                this.formInstance.updateData({
                                    supplierName: selectedItem ? selectedItem.name.trim() : ''
                                });

                                // Clear quotationUrl when supplier changes
                                const currentQuotation = this.formInstance.getEditor('quotationUrl')?.option('value');
                                if (currentQuotation) {
                                    this._clearQuotation();
                                    this.appMain.notification.info('Quotation cleared due to supplier change.');
                                }

                                this.isUpdatingFromSupplier = false;

                                this._revalidateForm();
                            }
                        }),
                        validationRules: [{
                            type: 'required',
                            message: 'Please select a supplier'
                        }]
                    },
                    {
                        dataField: 'supplierName',
                        visible: false,
                        editorOptions: {
                            readOnly: true,
                            stylingMode: 'outlined'
                        }
                    },
                    // Effective Date
                    {
                        dataField: 'effectiveDate',
                        colSpan: 1,
                        label: {
                            text: 'Effective Date',
                        },
                        editorType: 'dxDateBox',
                        editorOptions: getEditorOptions({
                            displayFormat: this.appMain.getDateFormat(),
                            placeholder: 'Select Effective Date',
                            useMaskBehavior: true,
                            readOnly: !!this.data.quotationUrl,
                            onValueChanged: (e) => {
                                this._revalidateForm();
                            }
                        }),
                        validationRules: [{
                            type: 'required',
                            message: 'Please select an effective date'
                        }]
                    },
                    // Is Urgent
                    {
                        dataField: 'isUrgent',
                        colSpan: 1,
                        label: {
                            text: 'Urgent',
                            cssClass: 'header-form-label'
                        },
                        editorType: 'dxCheckBox',
                        editorOptions: getEditorOptions({
                            text: 'Urgent'
                        }),
                    },
                    // Requester
                    {
                        dataField: 'requester',
                        colSpan: 1,
                        label: {
                            text: 'Requester',
                        },
                        editorOptions: {
                            readOnly: true,
                            stylingMode: 'outlined'
                        }
                    },
                    // Department
                    {
                        dataField: 'department',
                        colSpan: 1,
                        label: {
                            text: 'Department',
                        },
                        editorOptions: {
                            readOnly: true,
                            stylingMode: 'outlined'
                        }
                    },
                    // Remark
                    {
                        dataField: 'remark',
                        label: {
                            text: 'Remark',
                        },
                        editorType: 'dxTextArea',
                        editorOptions: getEditorOptions({
                            height: 80,
                            placeholder: 'Enter additional remarks',
                        }),
                        colSpan: 2
                    },
                ]
            }
        ];

        if (this.options.showAttachment) {
            formItems[1].items.push(
                // File Attachments
                {
                    dataField: 'attachments',
                    label: {
                        text: 'File Attachments',
                    },
                    cssClass: 'file-attachment-field',
                    template: (data, itemElement) => {
                        this._createFileUploader(itemElement);
                    },
                    colSpan: 2
                }
            )
        }

        // DevExtreme Form Configuration
        const formConfig = {
            formData: this.data,
            labelLocation: 'left',
            showColonAfterLabel: false,
            readOnly: this.mode === 'view',
            colCount: 2,
            items: formItems
        };

        // Initialize Form
        this.formInstance = $('#headerFormElements').dxForm(formConfig).dxForm('instance');

        // Update quotation button visibility
        this._updateQuotationButtonVisibility();
    }

    _createFileUploader(container) {
        const $wrapper = $('<div class="file-upload-section">').appendTo(container);

        this._renderFileList($wrapper);

        if (this.mode === 'form') {
            this._renderUploadZone($wrapper);
        }
    }

    _renderFileList($container) {
        const allFiles = this._getAllFiles();
        if (this.fileListInstance) {
            this.fileListInstance.dispose();
        }

        const $listContainer = $('<div class="mb-3">').appendTo($container);

        this.fileListInstance = $listContainer.dxList({
            dataSource: allFiles,
            minHeight: 300,
            selectionMode: 'none',
            focusStateEnabled: false,
            hoverStateEnabled: false,
            activeStateEnabled: false,
            noDataText: 'Do not have any files attached.',
            elementAttr: {
                class: 'custom-file-list'
            },
            onContentReady: (e) => {
                const $element = $(e.element);
                $element.find('.dx-scrollable-container').css('padding', '0');
                $element.find('.dx-list').css({
                    'border': 'none',
                    'box-shadow': 'none'
                });
                $element.find('.dx-list-item-content').css('padding', '0');
                $element.find('.dx-list-item').css({ 'border-top': 'none' });
            },
            itemTemplate: (data, index, element) => {
                const iconInfo = this._getFileIconWithStyle(data.name);

                const $item = $('<div class="file-list-item d-flex align-items-center gap-3">');

                // Icon
                $item.append(`
                    <i class="file-icon ${iconInfo.icon}"
                        style="color:${iconInfo.color}">
                    </i>
                `);

                // File info
                const $info = $(`
                    <div class="flex-grow-1">
                        <div class="file-name">${data.name}</div>
                        <div class="file-meta">
                            ${this._formatSize(data.size)}
                            ${data.isNew ? '<span style="margin-left:6px;">new</span>' : ''}
                        </div>
                    </div>
                `);
                $item.append($info);

                // Actions
                const $actions = $('<div class="file-actions d-flex gap-1">')
                    .appendTo($item);

                if (this._isPDFFile(data.name)) {
                    $('<div>').appendTo($actions).dxButton({
                        icon: 'eyeopen',
                        hint: 'View',
                        stylingMode: 'text',
                        onClick: () => this._previewFile(data)
                    });
                }

                $('<div>').appendTo($actions).dxButton({
                    icon: 'download',
                    hint: 'Download',
                    stylingMode: 'text',
                    onClick: () => this._downloadFile(data)
                });

                if (this.mode !== 'view') {
                    $('<div>').appendTo($actions).dxButton({
                        icon: 'trash',
                        hint: 'Delete',
                        stylingMode: 'text',
                        onClick: () => this._deleteFile(data)
                    });
                }

                return $item;
            },
        }).dxList('instance');
    }

    _isPDFFile(fileName) {
        const ext = fileName?.split('.').pop().toLowerCase();
        return ext === 'pdf';
    }

    canAddMoreFiles() {
        if (!this.options.maxAttachments) return true;
        return this._getAllFiles().length < this.options.maxAttachments;
    }

    _renderUploadZone($container) {
        const canUpload = this.canAddMoreFiles();

        $('<div class="mt-3">').appendTo($container).dxFileUploader({
            multiple: true,
            accept: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.svg',
            uploadMode: 'useButtons',
            selectButtonText: 'Select Files',
            labelText: canUpload
                ? 'or drag files here'
                : `Maximum ${this.options.maxAttachments} files reached`,
            maxFileSize: 10485760, // 10 MB
            disabled: !canUpload,
            onValueChanged: (e) => {
                if (e.value?.length) {
                    if (this.options.maxAttachments) {
                        const currentCount = this._getAllFiles().length;
                        const availableSlots = this.options.maxAttachments - currentCount;

                        if (availableSlots <= 0) {
                            this.appMain.notification.warning(
                                `Maximum ${this.options.maxAttachments} files allowed`
                            );
                            e.component.reset();
                            return;
                        }

                        if (e.value.length > availableSlots) {
                            this.appMain.notification.warning(
                                `You can only add ${availableSlots} more file(s)`
                            );
                            e.value = Array.from(e.value).slice(0, availableSlots);
                        }
                    }

                    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'svg'];
                    const maxFileSize = 10485760; // 10 MB

                    let oversizedCount = 0;
                    let invalidTypeCount = 0;

                    // Filter valid files
                    const validFiles = Array.from(e.value).filter(file => {
                        const ext = file.name.split('.').pop().toLowerCase();
                        const isValidType = allowedExtensions.includes(ext);
                        const isValidSize = file.size <= maxFileSize;

                        if (!isValidSize) oversizedCount++;
                        if (!isValidType) invalidTypeCount++;

                        return isValidType && isValidSize;
                    });

                    // Filter out duplicates
                    const newFiles = validFiles.filter(newFile => {
                        return !this.pendingFiles.some(existingFile =>
                            existingFile.name === newFile.name && existingFile.size === newFile.size
                        );
                    });

                    const duplicateCount = validFiles.length - newFiles.length;

                    // Show notifications
                    if (oversizedCount > 0) {
                        this.appMain.notification.error(
                            `${oversizedCount} file(s) exceed 10 MB and were not added.`
                        );
                    }
                    if (invalidTypeCount > 0) {
                        this.appMain.notification.warning(
                            `${invalidTypeCount} file(s) have invalid file types and were not added.`
                        );
                    }
                    if (duplicateCount > 0) {
                        this.appMain.notification.warning(
                            `${duplicateCount} duplicate file(s) were skipped.`
                        );
                    }
                    if (newFiles.length > 0) {
                        this.pendingFiles.push(...newFiles);
                        this._refreshFileList();
                        this.appMain.notification.success(
                            `${newFiles.length} file(s) added successfully.`
                        );

                        this._revalidateForm();
                    }

                    e.component.reset();
                }
            }
        });
    }

    async _openQuotationSelector() {
        // const supplierCode = this.formInstance.getEditor('supplierCode')?.option('value');
        // const supplierName = this.formInstance.getEditor('supplierName')?.option('value');
        const supplierCode = null;
        const supplierName = 'Nikon Thailand Co., Ltd.';

        const displayName = supplierCode && supplierName
            ? `${supplierCode} : ${supplierName}`
            : '';

        await this.quotationSelector.show(
            supplierCode || null,
            displayName || 'All Suppliers',
            (selectedQuotation) => {
                this._onQuotationSelected(selectedQuotation);
            }
        );
    }

    _onQuotationSelected(quotation) {
        if (!quotation || !quotation.code) {
            this.appMain.notification.error('Invalid quotation data');
            return;
        }

        this.isUpdatingFromQuotation = true;

        // Update quotation URL
        this.formInstance.updateData('quotationUrl', quotation.code);
        this._updateQuotationButtonVisibility();

        // Auto-fill supplier
        if (quotation.vendorCode && quotation.vendorName) {
            this.formInstance.updateData({
                supplierCode: quotation.vendorCode || '',
                supplierName: quotation.vendorName || ''
            });

            // Set supplier to readonly
            const supplierEditor = this.formInstance.getEditor('supplierCode');
            if (supplierEditor) {
                supplierEditor.option('readOnly', true);
                supplierEditor.option('stylingMode', 'outlined');
            }
        }

        // Auto-fill effective date
        if (quotation.validFrom) {
            this.formInstance.updateData('effectiveDate', new Date(quotation.validFrom));

            // Set effective date to readonly
            const effectiveDateEditor = this.formInstance.getEditor('effectiveDate');
            if (effectiveDateEditor) {
                effectiveDateEditor.option('readOnly', true);
                effectiveDateEditor.option('stylingMode', 'outlined');
            }
        }

        this.isUpdatingFromQuotation = false;

        this._revalidateForm();

        this.appMain.notification.success(
            `Selected: ${quotation.code}${quotation.vendorCode ? ' - ' + quotation.vendorCode : ''}`
        );
    }

    _updateQuotationButtonVisibility() {
        const quotationEditor = this.formInstance.getEditor('quotationUrl');
        if (!quotationEditor) return;

        const currentValue = quotationEditor.option('value');
        const hasValue = !!(currentValue && currentValue.trim());

        const buttons = quotationEditor.option('buttons');

        // Update View button
        const viewButton = buttons.find(b => b.name === 'view');
        if (viewButton) {
            viewButton.options.visible = hasValue;
        }

        // Update Clear button
        const clearButton = buttons.find(b => b.name === 'clearQuotation');
        if (clearButton) {
            clearButton.options.visible = hasValue;
        }

        // Force repaint to apply visibility changes
        quotationEditor.repaint();
    }

    _viewQuotation() {
        const quotationUrl = this.formInstance.getEditor('quotationUrl')?.option('value');

        if (!quotationUrl || quotationUrl.trim() === '') {
            this.appMain.notification.warning('No quotation selected');
            return;
        }

        const url = `${window.APP_CONFIG.qcsUrl.view}${quotationUrl}`;
        window.open(url, '_blank');
    }

    _clearQuotation() {
        this.formInstance.updateData({ quotationUrl: '' });
        this._updateQuotationButtonVisibility();

        // Enable supplier and effective date
        const supplierEditor = this.formInstance.getEditor('supplierCode');
        const effectiveDateEditor = this.formInstance.getEditor('effectiveDate');

        if (supplierEditor) {
            supplierEditor.option('value', null);
            supplierEditor.option('readOnly', false);
            supplierEditor.option('stylingMode', 'filled');
        }
        if (effectiveDateEditor) {
            effectiveDateEditor.option('value', null);
            effectiveDateEditor.option('readOnly', false);
            effectiveDateEditor.option('stylingMode', 'filled');
        }
    }

    _getAllFiles() {
        const files = [];
        if (this.data.fileAttachments) {
            this.data.fileAttachments.forEach(file => {
                if (!this.deletedFileIds.includes(file.id)) {
                    files.push({
                        id: file.id,
                        name: file.fileName,
                        size: file.length,
                        contentType: file.contentType,
                        isNew: false
                    });
                }
            });
        }

        this.pendingFiles.forEach((file, index) => {
            files.push({
                index: index,
                name: file.name,
                size: file.size,
                contentType: file.type,
                isNew: true,
                file: file
            });
        });
        return files;
    }

    async _previewFile(data) {
        if (data.isNew) {
            const url = URL.createObjectURL(data.file);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else {
            window.open(`/api/file-attachments/${data.id}/preview`, '_blank');
        }
    }

    async _downloadFile(data) {
        if (data.isNew) {
            // Download from memory
            const url = URL.createObjectURL(data.file);
            const link = document.createElement('a');
            link.href = url;
            link.download = data.name;
            link.click();
            URL.revokeObjectURL(url);
        } else {
            window.location.href = `/api/file-attachments/${data.id}/download`;
        }
    }

    async _deleteFile(data) {
        const result = await this.appMain.dialog.confirm({
            title: 'Confirm Delete',
            message: 'Are you sure you want to delete this file?',
            okText: 'Delete',
            type: 'danger'
        });

        if (!result) return;

        if (data.isNew) {
            this.pendingFiles.splice(data.index, 1);
        } else {
            this.deletedFileIds.push(data.id);
        }

        this._refreshFileList();
        this.appMain.notification.success('File deleted successfully.');

        this._revalidateForm();
    }

    _getFileIconWithStyle(fileName) {
        const ext = fileName?.split('.').pop().toLowerCase();

        if (['pdf'].includes(ext)) {
            return { icon: 'fa-solid fa-file-pdf', color: '#C62828' };
        }

        if (['doc', 'docx'].includes(ext)) {
            return { icon: 'fa-solid fa-file-word', color: '#1565C0' };
        }

        if (['xls', 'xlsx', 'csv'].includes(ext)) {
            return { icon: 'fa-solid fa-file-excel', color: '#2E7D32' };
        }

        if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(ext)) {
            return { icon: 'fa-solid fa-file-image', color: '#6A1B9A' };
        }

        if (['zip', 'rar', '7z'].includes(ext)) {
            return { icon: 'fa-solid fa-file-zipper', color: '#EF6C00' };
        }

        return { icon: 'fa-solid fa-file', color: '#757575' };
    }

    _formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    _refreshFileList() {
        if (this.fileListInstance) {
            this.fileListInstance.option('dataSource', this._getAllFiles());
        }

        if (this.formInstance && this.mode === 'form') {
            this.formInstance.getEditor('attachments')?.validate();
        }
    }

    validate() {
        if (!this.formInstance) {
            return this._createValidationResult(true);
        }

        // 1. Validate form
        const formValidation = this.formInstance.validate();
        
        // 2. ตรวจสอบว่ามี error อะไรบ้าง
        const hasOtherErrors = formValidation.brokenRules?.some(rule => {
            const field = rule.validator?.element?.dataset?.field;
            return field && field !== 'quotationUrl';
        });
        
        // 3. ถ้ามี error อื่นๆ (ไม่ใช่ quotationUrl) ให้ scroll ไปที่นั่นก่อน
        if (hasOtherErrors) {
            this._scrollToFirstNonQuotationError();
            return formValidation;
        }
        
        // 4. ถ้า error แค่ quotationUrl หรือไม่มี error เลย ให้ validate business rules
        return this._validateBusinessRules();
    }

    _validateBusinessRules() {
        // 1. Validate Supplier
        const supplierCode = this.formInstance.getEditor('supplierCode')?.option('value');
        if (!supplierCode) {
            const $supplierField = $(this.container).find('[data-field="supplierCode"]');
            if ($supplierField.length) {
                $supplierField[0].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
            
            return this._createValidationResult(
                false,
                'Please select a supplier',
                'required'
            );
        }
        
        // 2. Validate Quotation OR Attachment
        const quotationUrl = this._getQuotationUrl();
        const allFiles = this._getAllFiles();
        
        if (quotationUrl || allFiles.length > 0) {
            return this._createValidationResult(true);
        }
        
        // 3. แสดง error ทั้งสองที่พร้อมกัน
        this._showQuotationAndAttachmentErrors();
        
        return this._createValidationResult(
            false,
            'Please provide either a Quotation URL or attach at least one file',
            'custom'
        );
    }

    _showQuotationAndAttachmentErrors() {
        // 1. Highlight Quotation URL field
        const quotationEditor = this.formInstance.getEditor('quotationUrl');
        if (quotationEditor) {
            const $quotationField = $(quotationEditor.element()).closest('.dx-field-item');
            $quotationField.addClass('dx-invalid');
            
            // Add error message if not exists
            if (!$quotationField.find('.dx-invalid-message').length) {
                $quotationField.append(`
                    <div class="dx-invalid-message">
                        <span class="dx-invalid-message-content">
                            Please provide quotation URL or attach files
                        </span>
                    </div>
                `);
            }

            // Auto remove quotation error after 5 seconds
            setTimeout(() => {
                $quotationField.removeClass('dx-invalid');
                $quotationField.find('.dx-invalid-message-auto').fadeOut(300, function() {
                    $(this).remove();
                });
            }, 5000);
        }
        
        // 2. Highlight File Upload Section
        this._highlightFileSection();
        
        // 3. Scroll to quotation field 
        const $quotationField = $(this.container).find('[data-field="quotationUrl"]');
        if ($quotationField.length) {
            $quotationField[0].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    _highlightFileSection() {
        const $fileSection = $(this.container).find('.file-upload-section');
        
        // Add validation error styling
        $fileSection.addClass('validation-error');
        
        // Add error message if not exists
        if (!$fileSection.find('.file-section-error').length) {
            $fileSection.prepend(`
                <div class="file-section-error dx-invalid-message" style="margin-bottom: 12px;">
                    <span class="dx-invalid-message-content">
                        Please attach at least one file or provide quotation URL
                    </span>
                </div>
            `);
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            $fileSection.removeClass('validation-error');
            $fileSection.find('.file-section-error').fadeOut(300, function() {
                $(this).remove();
            });
        }, 5000);
    }

    _clearValidationErrors() {
        // Clear quotation URL error
        const quotationEditor = this.formInstance.getEditor('quotationUrl');
        if (quotationEditor) {
            const $quotationField = $(quotationEditor.element()).closest('.dx-field-item');
            $quotationField.removeClass('dx-invalid');
            $quotationField.find('.dx-invalid-message').remove();
        }
        
        // Clear file section error
        const $fileSection = $(this.container).find('.file-upload-section');
        $fileSection.removeClass('validation-error');
        $fileSection.find('.file-section-error').remove();
    }

    _hasFieldError(fieldName, validationResult) {
        if (!validationResult || !validationResult.brokenRules) return false;
        
        return validationResult.brokenRules.some(rule => 
            rule.validator?.element?.dataset?.field === fieldName
        );
    }

    _scrollToFirstNonQuotationError() {
        const $errors = $(this.container).find('.dx-invalid');
        
        for (let i = 0; i < $errors.length; i++) {
            const $error = $errors.eq(i);
            const $field = $error.closest('.dx-field-item');
            const dataField = $field.find('[data-field]').attr('data-field');
            
            if (dataField !== 'quotationUrl') {
                $error[0].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                break;
            }
        }
    }

    _scrollToFirstError() {
        const $firstError = $(this.container).find('.dx-invalid').first();
        if ($firstError.length) {
            $firstError[0].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    _getQuotationUrl() {
        const value = this.formInstance.getEditor('quotationUrl')?.option('value');
        return value && value.trim() !== '' ? value : null;
    }

    _createValidationResult(isValid, message = '', type = 'custom') {
        if (isValid) {
            return {
                isValid: true,
                brokenRules: []
            };
        }
        
        return {
            isValid: false,
            brokenRules: [{
                type: type,
                message: message,
                validator: null
            }]
        };
    }

    _revalidateForm() {
        if (!this.formInstance) return;

        // Clear custom validation errors
        this._clearValidationErrors();

        // Force re-render validation by updating formData
        const currentData = this.formInstance.option('formData');
        this.formInstance.option('formData', { ...currentData });

        // Optional: Clear validation errors
        setTimeout(() => {
            const quotationEditor = this.formInstance.getEditor('quotationUrl');
            const supplierEditor = this.formInstance.getEditor('supplierCode');

            if (quotationEditor) {
                quotationEditor.option('isValid', true);
            }
            if (supplierEditor) {
                supplierEditor.option('isValid', true);
            }
        }, 50);
    }

    get() {
        if (this.formInstance) {
            const formData = this.formInstance.option('formData');

            return {
                ...formData,

                // New Attachments
                newAttachments: this.pendingFiles,
                // Deleted Attachment IDs
                deletedAttachmentIds: this.deletedFileIds,
                totalAttachments: this._getAllFiles().length
            };
        }
        return this.data;
    }

    getAttachmentData() {
        return {
            existingFiles: this.data.fileAttachments?.filter(
                file => !this.deletedFileIds.includes(file.id)
            ) || [],

            newFiles: this.pendingFiles,
            deletedFileIds: this.deletedFileIds,
            allFiles: this._getAllFiles(),

            stats: {
                existing: this.data.fileAttachments?.length || 0,
                added: this.pendingFiles.length,
                deleted: this.deletedFileIds.length,
                total: this._getAllFiles().length
            }
        };
    }

    update(data) {
        this.data = data;
        this.render();
    }

    reset() {
        if (this.formInstance) {
            this.formInstance.resetValues();
        }
    }

    clear() {
        this.data = null;
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    dispose() {
        // Cleanup quotation selector
        if (this.quotationSelector) {
            this.quotationSelector.dispose();
            this.quotationSelector = null;
        }

        // Cleanup form
        if (this.formInstance) {
            this.formInstance.dispose();
            this.formInstance = null;
        }

        // Cleanup file list
        if (this.fileListInstance) {
            this.fileListInstance.dispose();
            this.fileListInstance = null;
        }

        // Clear data
        this.pendingFiles = [];
        this.deletedFileIds = [];
        this.data = null;
    }
}