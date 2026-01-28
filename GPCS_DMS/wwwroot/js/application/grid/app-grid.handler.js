class GridHandler {
    constructor(appMain, onDeleteSuccess = null, onInputSuccess = null) {
        this.appMain = appMain;
        this._isDeleting = false;
        this._isDeletingSelected = false;

        this.onDeleteSuccess = onDeleteSuccess || null;
        this.onInputSuccess = onInputSuccess || null;
    }

    async handleSingleDelete(e) {
        if (this._isDeleting) return;
        this._isDeleting = true;

        try {
            const confirmed = await this.appMain.dialog.confirm({
                title: 'Confirm Delete',
                message: 'Are you sure you want to remove this item?',
                type: 'warning'
            });

            if (confirmed) {
                const rowIndex = e.row.rowIndex;
                e.component.deleteRow(rowIndex);
                this.appMain.notification.success('Item deleted successfully');
            }
        } finally {
            setTimeout(() => {
                this._isDeleting = false;
            }, 100);
        }
    }

    async handleBulkDelete() {
        if (this._isDeletingSelected) return;

        const grid = window.appGridInstance?.gridInstance;
        if (!grid) return;

        const selectedRows = grid.getSelectedRowsData();

        if (selectedRows.length === 0) {
            this.appMain.notification.warning('Please select at least one item to delete');
            return;
        }

        this._isDeletingSelected = true;

        try {
            const confirmed = await this.appMain.dialog.confirm({
                title: 'Confirm Delete',
                message: `Are you sure you want to delete ${selectedRows.length} selected item(s)?`,
                type: 'warning'
            });

            if (!confirmed) return;

            const dataSource = grid.option('dataSource') || [];

            const newData = dataSource.filter(item =>
                !selectedRows.some(selected =>
                    item.id ? item.id === selected.id :
                        JSON.stringify(item) === JSON.stringify(selected)
                )
            );

            grid.option('dataSource', newData);
            grid.clearSelection();

            if(this.onDeleteSuccess){
                this.onDeleteSuccess();
            }

            this.appMain.notification.success(`Successfully deleted ${selectedRows.length} item(s)`);

        } catch (error) {
            console.error('Error:', error);
            this.appMain.notification.error('Failed to delete selected items');
        } finally {
            setTimeout(() => this._isDeletingSelected = false, 100);
        }
    }

    handleInputSelected() {
        const grid = window.appGridInstance?.gridInstance;
        if (!grid) return;

        const selectedRows = grid.getSelectedRowsData();

        if (selectedRows.length === 0) {
            this.appMain.notification.warning('Please select at least one item to input');
            return;
        }

        if(this.onInputSuccess){
            this.onInputSuccess();
        }
    }
}