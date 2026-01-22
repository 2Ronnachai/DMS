class GridToolbarBuilder{
    constructor(appMain) {
        this.appMain = appMain;
    }

    getEditableToolbar() {
        return {
            items: [
                this._getDeleteSelectedButton(),
                this._getRefreshButton(),
                this._getExportButton(),
                'searchPanel'
            ]
        };
    }

    getViewOnlyToolbar() {
        return {
            items: [
                this._getRefreshButton(),
                this._getExportButton(),
                'searchPanel'
            ]
        };
    }

    _getDeleteSelectedButton() {
        return {
            location: 'before',
            template: () => {
                return $('<button/>')
                    .addClass('dialog-btn dialog-danger dialog-btn-ok')
                    .html('<i class="fas fa-trash"></i> Delete Selected')
                    .on('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        $(e.currentTarget).blur();
                        
                        const deleteHandler = new GridDeleteHandler(this.appMain);
                        deleteHandler.handleBulkDelete();
                    });
            }
        };
    }

    _getRefreshButton() {
        return {
            location: 'after',
            template: () => {
                return $('<button/>')
                    .addClass('dialog-btn dialog-btn-cancel')
                    .html('<i class="fas fa-sync-alt"></i> Refresh')
                    .on('click', (e) => {
                        e.preventDefault();
                        $(e.currentTarget).blur();
                        if (window.appGridInstance) {
                            window.appGridInstance.refresh();
                        }
                    });
            }
        };
    }

    _getExportButton() {
        return {
            location: 'after',
            template: () => {
                return $('<button/>')
                    .addClass('dialog-btn dialog-btn-cancel')
                    .html('<i class="fas fa-file-excel"></i> Export Excel')
                    .on('click', (e) => {
                        e.preventDefault();
                        $(e.currentTarget).blur();
                        
                        // const exportHandler = new ExportHandler(this.appMain);
                        // exportHandler.exportToExcel();
                    });
            }
        };
    }
}