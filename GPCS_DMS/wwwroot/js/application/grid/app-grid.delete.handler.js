class GridDeleteHandler {
    constructor(appMain) {
        this.appMain = appMain;
        this._isDeleting = false;
        this._isDeletingSelected = false;
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

        const gridInstance = window.appGridInstance?.gridInstance;
        if (!gridInstance) return;

        const selectedRows = gridInstance.getSelectedRowsData();

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

            const currentData = gridInstance.option('dataSource') || [];
            const selectedIds = selectedRows.map(row => row.id);
            const newData = currentData.filter(item => !selectedIds.includes(item.id));

            gridInstance.option('dataSource', newData);
            gridInstance.clearSelection();

            this.appMain.notification.success(`Successfully deleted ${selectedRows.length} item(s)`);

        } catch (error) {
            console.error('Error deleting selected items:', error);
            this.appMain.notification.error('Failed to delete selected items');
        } finally {
            setTimeout(() => {
                this._isDeletingSelected = false;
            }, 100);
        }
    }
}