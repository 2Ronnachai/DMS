/**
 * GridExportManager - จัดการ Export Excel
 */
class GridExportManager {
    constructor(gridInstance, options = {}) {
        this.dialog = appDialog;
        this.loading = appLoading;
        this.notification = appNotification;
        this.gridInstance = gridInstance;
        this.exportFileName = options.exportFileName || 'DataExport';
    }


    exportAll(e) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data');

        DevExpress.excelExporter.exportDataGrid({
            component: e.component,
            worksheet: worksheet,
            autoFilterEnabled: true,
            customizeCell: ({ gridCell, excelCell }) => {
                if (gridCell.rowType === 'header') {
                    excelCell.font = { bold: true };
                    excelCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' }
                    };
                }
            }
        }).then(() => {
            workbook.xlsx.writeBuffer().then((buffer) => {
                this._downloadFile(buffer, `${this.exportFileName}_${this._getTimestamp()}.xlsx`);
            });
        });
        
        e.cancel = true;
    }

    exportSelected() {
        if (!this.gridInstance) {
            this.notification.show('Grid instance not found', 'error');
            return;
        }

        const selectedRowsData = this.gridInstance.getSelectedRowsData();
        
        if (selectedRowsData.length === 0) {
            this.notification.show('Please select rows to export', 'warning');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Selected Data');

        // Get visible columns
        const columns = this.gridInstance.getVisibleColumns();
        const exportColumns = columns.filter(col => col.dataField && col.visible !== false);

        // Add headers
        const headerRow = worksheet.addRow(exportColumns.map(col => col.caption || col.dataField));
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };

        // Add data rows
        selectedRowsData.forEach(rowData => {
            const row = exportColumns.map(col => rowData[col.dataField]);
            worksheet.addRow(row);
        });

        // Auto-fit columns
        worksheet.columns.forEach((column) => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, (cell) => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            column.width = maxLength < 10 ? 10 : maxLength + 2;
        });

        // Download file
        workbook.xlsx.writeBuffer().then((buffer) => {
            this._downloadFile(buffer, `${this.exportFileName}_Selected_${this._getTimestamp()}.xlsx`);
        });

        this.notification.show(`Exported ${selectedRowsData.length} rows`, 'success');
    }


    _downloadFile(buffer, filename) {
        const blob = new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    _getTimestamp() {
        const now = new Date();
        return now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            '_' +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');
    }
}
