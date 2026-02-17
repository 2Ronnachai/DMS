class GridToolbarBuilder{
    constructor(appMain) {
        this.appMain = appMain;
    }

    getEditableToolbar(onDeleteSuccess = null, onInputSuccess = null) {
        return {
            items: [
                this._getDeleteSelectedButton(onDeleteSuccess),
                ...(this.appMain.applicationType.toLowerCase() === 'edititems' ? [this._getInputSelected(onInputSuccess)] : []),
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

    _getDeleteSelectedButton(onDeleteSuccess = null) {
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
                        
                        const handler = new GridHandler(
                            this.appMain, 
                            onDeleteSuccess
                        );
                        handler.handleBulkDelete();
                    });
            }
        };
    }

    _getRefreshButton() {
        return {
            // location: 'after',
            // template: () => {
            //     return $('<button/>')
            //         .addClass('dialog-btn dialog-btn-cancel')
            //         .html('<i class="fas fa-sync-alt"></i> Refresh')
            //         .on('click', (e) => {
            //             e.preventDefault();
            //             $(e.currentTarget).blur();
            //             if (window.appGridInstance) {
            //                 window.appGridInstance.refresh();
            //             }
            //         });
            // }
        };
    }

    _getExportButton() {
        return {
            // location: 'after',
            // template: () => {
            //     return $('<button/>')
            //         .addClass('dialog-btn dialog-btn-cancel')
            //         .html('<i class="fas fa-file-excel"></i> Export Excel')
            //         .on('click', (e) => {
            //             e.preventDefault();
            //             $(e.currentTarget).blur();
                        
            //             // const exportHandler = new ExportHandler(this.appMain);
            //             // exportHandler.exportToExcel();
            //         });
            // }
        };
    }

    _getInputSelected(onInputSuccess = null) {
        return {
            location: 'before',
            template: () => {
                return $('<button/>')
                    .addClass('dialog-btn dialog-info dialog-btn-ok')
                    .html('<i class="fas fa-plus"></i> Input Selected')
                    .on('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        $(e.currentTarget).blur();
                        
                        const handler = new GridHandler(this.appMain, null, onInputSuccess);
                        handler.handleInputSelected();
                    });
            }
        };
    }
}