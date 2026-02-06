const groupOfGoodsDataSource = new DevExpress.data.CustomStore({
    key: 'id',
    load: async () => {
        const config = {
            groupOfGoods: { enabled: true, ttl: 10 * 60 * 1000 },
        };

        try {
            const response = config.groupOfGoods.enabled
                ? await Http.getCache('groupofgoods/lookups/', config.groupOfGoods.ttl)
                : await Http.get('groupofgoods/lookups/');

            if (response && response.success) {
                console.log('Loaded Group of Goods data from cache/server:', response.data);
                return response.data || [];
            }
        } catch (error) {
            console.error('Failed to load Group of Goods lookup:', error);
        }

        return [];
    }
});

const DataItemGridConfig = {
    gridId: 'gridDataItemGrid',
    container: '#gridDataItem',
    endpoint: window.APP_CONFIG.baseUrl + 'dxGridDataItems/',
    keyField: 'id',
    exportFileName: 'Data_Item',
    onRowPrepared: (e) => {
        if (e.rowType === 'data') {
            if (e.data.quotationExpiryDate) {
                const expiryDate = new Date(e.data.quotationExpiryDate);
                const today = new Date();

                today.setHours(0, 0, 0, 0);
                expiryDate.setHours(0, 0, 0, 0);

                const diffTime = expiryDate - today;
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Remove old classes
                e.rowElement.removeClass('expiry-critical expiry-warning expiry-notice expiry-expired');

                let className = '';
                if (daysRemaining < 0) {
                    className = 'expiry-expired';
                } else if (daysRemaining <= 15) {
                    className = 'expiry-critical';
                } else if (daysRemaining <= 30) {
                    className = 'expiry-warning';
                } else if (daysRemaining <= 45) {
                    className = 'expiry-notice';
                }

                if (className) {

                    e.rowElement.addClass(className);
                    e.rowElement.attr('title', `Days remaining: ${daysRemaining}`);
                }
            } else {
                console.log('No expiry date for row:', e.data.id);
            }
        }
    },
    columns: [
        GridHelper.createNumberColumn('id', 'ID', '#,##0', {
            width: 80,
            allowEditing: false,
            fixed: true,
            visible: false
        }),
        GridHelper.createColumn('code', 'Item Code', {
            width: 220,
            fixed: true,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createColumn('description', 'Description', {
            minWidth: 250,
            validationRules: [{ type: 'required' }]
        }),

        // Data Material Section
        GridHelper.createColumn('dataMaterialCode', 'Material Code', {
            width: 150,
            validationRules: [{ type: 'required' }]
        }),

        // Supplier Section
        GridHelper.createColumn('supplierCode', 'Supplier', {
            width: 300,
            calculateDisplayValue: (rowData) => {
                return rowData.supplierCode && rowData.supplierName
                    ? `${rowData.supplierCode} : ${rowData.supplierName}`
                    : rowData.supplierCode || '-';
            },
            validationRules: [{ type: 'required' }]
        }),

        // Unit & Currency
        GridHelper.createColumn('unit', 'Unit', {
            width: 80,
            validationRules: [{ type: 'required' }]
        }),

        // Pricing Information
        GridHelper.createNumberColumn('unitPrice', 'Unit Price', '#,##0.00', {
            width: 130,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createColumn('currency', 'Currency', {
            width: 100,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createNumberColumn('conversionRate', 'Conv. Rate', '#,##0.00', {
            width: 120,
            validationRules: [{ type: 'required' }]
        }),

        // Order Information
        GridHelper.createNumberColumn('moq', 'MOQ', '#,##0', {
            width: 100,
            caption: 'Min Order Qty',
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createNumberColumn('lotSize', 'Lot Size', '#,##0', {
            width: 100
        }),
        GridHelper.createNumberColumn('leadTime', 'Lead Time (Days)', '#,##0', {
            width: 130,
            validationRules: [{ type: 'required' }]
        }),

        // Quotation Dates
        GridHelper.createDateColumn('quotationEffectiveDate', 'Effective Date', 'dd/MM/yyyy', {
            width: 130,
            validationRules: [{ type: 'required' }]
        }),
        GridHelper.createDateColumn('quotationExpiryDate', 'Expiry Date', 'dd/MM/yyyy', {
            width: 130,
            validationRules: [{ type: 'required' }]
        }),
        // Flags
        GridHelper.createBooleanColumn('ponecFlag', 'PO NEC', {
            width: 100,
        }),

        GridHelper.createLookupColumn('groupOfGoods', 'Group of Goods',
            groupOfGoodsDataSource,
            'displayName',
            'id',
            {
                width: 150,
            }
        ),

        GridHelper.createNumberColumn('runningNumber', 'Running No.', '#,##0', {
            width: 110,
            allowEditing: false,
            visible: false
        }),
        ...GridFactory.getAuditColumns()
    ]
};
window.DataItemGridConfig = DataItemGridConfig;