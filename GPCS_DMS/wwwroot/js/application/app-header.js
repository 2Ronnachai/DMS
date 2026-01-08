class AppHeader{
    constructor(appMain){
        this.appMain = appMain;
        this.container = document.getElementById('headerSection');
        this.data = null;
        this.mode = null; // 'create', 'edit', 'view', 'approve'

        this.pendingFiles = []; // For files added but not yet saved
        this.deletedFileIds = []; // For IDs of files marked for deletion
        this.fileListInstance = null;
        this.formInstance = null;
    }

    setData(headerData){
        console.log('Setting header data:', headerData);
        this.data = headerData;
        this.render();
    }

    render(){
        if(!this.container || !this.data) return;

        // Determine render mode based on appMain.mode
        this.mode = (this.appMain.mode === 'create' || this.appMain.mode === 'edit') ? 'form' : 'view';

        // Clear container
        this.container.innerHTML = '';

        this._renderForm();
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

    _renderForm(){
        const formContainer = document.createElement('div');
        formContainer.className = 'header-form-container';
        formContainer.innerHTML = `
            <divl class="card mb-3">
                <div class="card-body">
                    <div id="headerFormElements"></div>
                </div>
            </div>
        `;
        this.container.append(formContainer);
        console.log('Data : ', this.data);

        // DevExtreme Form Configuration
        const formConfig = {
            formData: this.data,
            labelLocation: 'left',
            showColonAfterLabel: false,
            readOnly: this.mode === 'view',
            stylingMode: this.mode === 'view' ? 'outlined' : 'filled',
            colCount: 2,
            items: [
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
                                            <span style="
                                                font-size:18px;
                                                font-weight:600;
                                                color:#212121;
                                            ">
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
                    items:[
                        // Supplier
                        {
                            dataField: 'supplierId',
                            colSpan: 2,
                            label: {
                                text: 'Supplier',
                            },
                            editorType: 'dxSelectBox',
                            editorOptions: {
                                dataSource: [], // To be loaded dynamically
                                displayExpr: 'name',
                                valueExpr: 'id',
                                placeholder: 'Select Supplier',
                                searchEnabled: true,
                                searchMode: 'contains',
                                searchExpr: ['name', 'code'],
                                stylingMode: 'outlined'
                            },
                            validationRules: [{
                                type: 'required',
                                message: 'Please select a supplier'
                            }]
                        },
                        // Effective Date
                        {
                            dataField: 'effectiveDate',
                            colSpan: 1,
                            label: {
                                text: 'Effective Date',
                            },
                            editorType: 'dxDateBox',
                            editorOptions: {
                                displayFormat: this.appMain.getDateFormat(),
                                placeholder: 'Select Effective Date',
                                stylingMode: 'outlined',
                                useMaskBehavior: true
                            },
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
                            editorOptions: {
                                text: 'Urgent'
                            },
                        },
                        // Requestor
                        {
                            dataField: 'requestor',
                            colSpan: 1,
                            label: {
                                text: 'Requestor',
                            },
                            editorOptions:{
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
                            editorOptions:{
                                readOnly: true,
                                stylingMode: 'outlined'
                            }
                        },
                        // Quotation URL
                        {
                            dataField: 'quotationUrl',
                            label: {
                                text: 'Quotation URL',
                            },
                            editorType: 'dxTextBox',
                            editorOptions: {
                                placeholder: 'https://example.com/quotation.pdf',
                                stylingMode: 'outlined'
                            },
                            validationRules: [{
                                type: 'pattern',
                                pattern: /^( https?:\/\/ )?.+/,
                                message: 'Please enter a valid URL'
                            }],
                            colSpan: 2
                        },

                        // Remark
                        {
                            dataField: 'remark',
                            label: {
                                text: 'Remark',
                            },
                            editorType: 'dxTextArea',
                            editorOptions: {
                                height: 80,
                                placeholder: 'Enter additional remarks',
                                stylingMode: 'outlined'
                            },
                            colSpan: 2
                        },

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
                    ]
                }
            ]
        };
        
        // Initialize Form
        this.formInstance = $('#headerFormElements').dxForm(formConfig).dxForm('instance');
    }

    _createFileUploader(container){
        const $wrapper = $('<div class="file-upload-section">').appendTo(container);

        this._renderFileList($wrapper);

        if(this.mode === 'form'){
            this._renderUploadZone($wrapper);
        }
    }

    _renderFileList($container) {
        const allFiles = this._getAllFiles();
        console.log('Rendering file list with files:', allFiles);
        
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
            elementAttr:{
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

    _renderUploadZone($container) {
        $('<div class="mt-3">').appendTo($container).dxFileUploader({
            multiple: true,
            accept: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.svg',
            uploadMode: 'useButtons',
            selectButtonText: 'Select Files',
            labelText: 'or drag files here',
            maxFileSize: 10485760, // 10 MB
            onValueChanged: (e) => {
                if (e.value?.length) {
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
                    }

                    e.component.reset();
                }
            }
        });
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
        console.log('All files (existing + pending):', files);
        return files;
    }

    _refreshFileList() {
        if (this.fileListInstance) {
            this.fileListInstance.option('dataSource', this._getAllFiles());
        }
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

    validate(){
        if(this.formInstance){
            const result = this.formInstance.validate();
            return result.isValid;
        }
        return true; // View mode always valid
    }

    getData(){
        if(this.formInstance){
            return this.formInstance.option('formData');
        }
        return this.data;
    }

    reset(){
        if(this.formInstance){
            this.formInstance.resetValues();
        }
    }

    clear() {
        this.data = null;
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

}