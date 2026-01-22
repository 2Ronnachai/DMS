const columnDefinitions = {
    // ============================================
    // BASIC COLUMNS
    // ============================================
    ID: {
        dataField: 'id',
        caption: 'ID',
        visible: false
    },

    ITEM_ID: {
        dataField: 'item.id',
        caption: 'Item ID',
        visible: false
    },

    NO: {
        dataField: 'no',
        caption: 'No.',
        allowEditing: false,
        alignment: 'center',
        width: 50,
        cellTemplate: (container, options) => {
            const pageIndex = options.component.pageIndex();
            const pageSize = options.component.pageSize();
            const rowNumber = (pageIndex * pageSize) + options.rowIndex + 1;
            $('<div>').html(`${rowNumber}`).appendTo(container);
        }
    },

    // ============================================
    // KEY IDENTIFYING COLUMNS
    // ============================================
    MATERIAL_RUNNING_NUMBER: {
        dataField: 'materialRunningNumber',
        caption: 'Material Running Number',
        allowEditing: false,
        visible: false
    },

    MATERIAL_CODE:{
        dataField: 'materialCode',
        caption: 'Material Code',
        allowEditing: false,
        visible: true
    },

    // ============================================
    // LOOKUP COLUMNS
    // ============================================
    CATEGORY: (lookupData) => ({
        dataField: 'categoryId',
        caption: 'Category',
        allowEditing: false,
        lookup: {
            dataSource: lookupData.categories,
            valueExpr: 'id',
            displayExpr: 'displayName'
        }
    }),

    MATERIAL_TYPE: (lookupData) => ({
        dataField: 'materialTypeId',
        caption: 'Material Type',
        allowEditing: false,
        lookup: {
            dataSource: lookupData.materialTypes,
            displayExpr: 'displayName',
            valueExpr: 'id'
        }
    }),

    GROUP_OF_GOODS: (lookupData) => ({
        dataField: 'item.groupOfGoods',
        caption: 'Group of Goods',
        allowEditing: false,
        lookup: {
            dataSource: lookupData.groupOfGoods,
            displayExpr: 'displayName',
            valueExpr: 'id'
        }
    }),

    // ============================================
    // DUAL-ROW COLUMNS (Material vs Item)
    // ============================================
    DESCRIPTION: {
        caption: 'Description',
        cellTemplate: (container, options) => {
            $('<div>').html(`
                <div style="padding: 4px 0; border-bottom: 1px solid #e0e0e0;">
                    ${options.data.materialDescription || '-'}
                </div>
                <div style="padding: 4px 0; color: #666;">
                    ${options.data.item?.itemDescription || '-'}
                </div>
            `).appendTo(container);
        }
    },

    MATERIAL_DESCRIPTION: {
        dataField: 'materialDescription',
        caption: 'Material Description',
        visible: false
    },

    ITEM_DESCRIPTION: {
        dataField: 'item.itemDescription',
        caption: 'Item Description',
        visible: false
    },

    UNIT: {
        caption: 'Unit',
        cellTemplate: (container, options) => {
            $('<div>').html(`
                <div style="padding: 4px 0; border-bottom: 1px solid #e0e0e0;">
                    ${options.data.materialUnit || '-'}
                </div>
                <div style="padding: 4px 0; color: #666;">
                    ${options.data.item?.itemUnit || '-'}
                </div>
            `).appendTo(container);
        }
    },

    MATERIAL_UNIT: {
        dataField: 'materialUnit',
        caption: 'Material Unit',
        visible: false
    },

    ITEM_UNIT: {
        dataField: 'item.itemUnit',
        caption: 'Item Unit',
        visible: false
    },

    PRICE: {
        caption: 'Price',
        cellTemplate: (container, options) => {
            const formatPrice = (price) => {
                return price != null ? price.toLocaleString('en-US', { 
                    minimumFractionDigits: 4, 
                    maximumFractionDigits: 4 
                }) : '-';
            };
            
            $('<div>').html(`
                <div style="padding: 4px 0; border-bottom: 1px solid #e0e0e0;">
                    ${formatPrice(options.data.materialUnitPrice)} THB
                </div>
                <div style="padding: 4px 0; color: #666;">
                    ${formatPrice(options.data.item?.itemUnitPrice)} ${options.data.item?.currency || ''}
                </div>
            `).appendTo(container);
        }
    },

    MATERIAL_UNIT_PRICE: {
        dataField: 'materialUnitPrice',
        caption: 'Material Unit Price',
        visible: false
    },

    ITEM_UNIT_PRICE: {
        dataField: 'item.itemUnitPrice',
        caption: 'Item Unit Price',
        visible: false
    },

    // ============================================
    // STANDARD COLUMNS
    // ============================================
    MINIMUM_ORDER: {
        dataField: 'minimumOrder',
        caption: 'Safety stock',
        allowEditing: false
    },

    COST_CENTER: {
        dataField: 'costCenter',
        caption: 'Cost Center',
        allowEditing: false
    },

    CONVERSION_RATE: {
        dataField: 'item.conversionRate',
        caption: 'Conversion Rate',
        allowEditing: false
    },

    MOQ: {
        dataField: 'item.moq',
        caption: 'MOQ',
        allowEditing: false
    },

    LOT_SIZE: {
        dataField: 'item.lotSize',
        caption: 'Lot Size',
        allowEditing: false
    },

    CURRENCY: {
        dataField: 'item.currency',
        caption: 'Currency',
        allowEditing: false,
        visible: false
    },

    LEAD_TIME: {
        dataField: 'item.leadTime',
        caption: 'Lead Time',
        allowEditing: false
    },

    QUOTATION_EXPIRY_DATE: (dateFormat) => ({
        dataField: 'item.quotationExpiryDate',
        caption: 'Quotation Expiry Date',
        dataType: 'date',
        format: dateFormat,
        allowEditing: false
    }),

    // ============================================
    // ACTION BUTTONS
    // ============================================
    DELETE_BUTTON: (onClickHandler) => ({
        type: 'buttons',
        fixed: true,
        fixedPosition: 'right',
        width: 70,
        buttons: [{
            hint: 'Delete',
            icon: 'trash',
            cssClass: 'text-danger',
            onClick: onClickHandler
        }]
    })
}