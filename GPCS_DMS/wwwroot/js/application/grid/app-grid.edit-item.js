class EditItemsGridConfig {
    constructor(appMain, lookupData) {
        this.appMain = appMain;
        this.lookupData = lookupData;
        this.handler = new GridHandler(appMain);
        this.toolbarBuilder = new GridToolbarBuilder(appMain);

        this.compareFields = {
            'item.itemDescription': 'description',
            'item.itemUnit': 'unit',
            'item.itemUnitPrice': 'unitPrice',
            'item.moq': 'moq',
            'item.lotSize': 'lotSize',
            'item.leadTime': 'leadTime',
            'item.currency': 'currency',
            'item.conversionRate': 'conversionRate',
            'item.quotationExpiryDate': 'quotationExpiryDate',
            'item.groupOfGoods': 'groupOfGoods'
        };
    }

    hasChanged(rowData, dataField) {
        if (!this.compareFields[dataField]) {
            return false;
        }

        const item = rowData.item;

        const fieldName = dataField.replace('item.', '');
        const currentValue = item[fieldName];

        if (item.itemHistory) {
            const historyField = this.compareFields[dataField];
            const historyValue = item.itemHistory[historyField];

            if (dataField === 'item.quotationExpiryDate') {
                const current = currentValue ? new Date(currentValue).toDateString() : null;
                const hist = historyValue ? new Date(historyValue).toDateString() : null;
                return current !== hist;
            }

            return currentValue !== historyValue;
        }

        const appGrid = window.appGridInstance;
        if (!appGrid) return false;

        const snapshot = appGrid.getInitialSnapshot(item.itemCode);
        if (!snapshot) return false;

        const snapshotValue = snapshot[fieldName];

        if (dataField === 'item.quotationExpiryDate') {
            const current = currentValue ? new Date(currentValue).toDateString() : null;
            const initial = snapshotValue ? new Date(snapshotValue).toDateString() : null;
            return current !== initial;
        }

        return currentValue !== snapshotValue;
    }

    formatHistoryValue(dataField, value, rowData) {
        if (value === null || value === undefined) return 'N/A';

        const fieldName = dataField.replace('item.', '');

        switch (fieldName) {
            case 'quotationExpiryDate':
                return new Date(value).toLocaleDateString();
            case 'itemUnitPrice':
                let currency = 'THB';

                if (rowData.item?.itemHistory) {
                    currency = rowData.item.itemHistory.currency || 'THB';
                } else {
                    const appGrid = window.appGridInstance;
                    const snapshot = appGrid?.getInitialSnapshot(rowData.item?.itemCode);
                    currency = snapshot?.currency || 'THB';
                }

                return `${parseFloat(value).toLocaleString('en-US', {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 4
                })} ${currency}`;
            case 'groupOfGoods':
                const groupOfGoods = this.lookupData?.groupOfGoods?.find(g => g.id === value);
                return groupOfGoods ? groupOfGoods.displayName : value.toString();
            default:
                return value.toString();
        }
    }

    onCellPrepared(e) {
        if (e.rowType === 'data' && this.compareFields[e.column.dataField]) {
            const hasChange = this.hasChanged(e.data, e.column.dataField);

            if (hasChange) {
                e.cellElement.addClass('cell-changed');

                const fieldName = e.column.dataField.replace('item.', '');
                let compareValue;
                let labelText;

                if (e.data.item?.itemHistory) {
                    const historyField = this.compareFields[e.column.dataField];
                    compareValue = e.data.item.itemHistory[historyField];
                    labelText = 'Previous';
                }
                else {
                    const appGrid = window.appGridInstance;
                    const snapshot = appGrid?.getInitialSnapshot(e.data.item?.itemCode);
                    compareValue = snapshot?.[fieldName];
                    labelText = 'Original';
                }

                const formattedValue = this.formatHistoryValue(
                    e.column.dataField,
                    compareValue,
                    e.data
                );

                e.cellElement.attr('title', `${labelText}: ${formattedValue}`);
            }
        }
    }

    getColumns(editable = false) {
        const columns = [
            columnDefinitions.ID,
            columnDefinitions.ITEM_ID,
            columnDefinitions.NO,
        ];
        columns.push(...this._getItemColumnsConfig());

        columns.push(...this._getMaterialColumnsConfig());

        if (editable) {
            columns.push(
                {
                    type: 'buttons',
                    fixed: true,
                    fixedPosition: 'right',
                    buttons: [
                        'edit',
                        {
                            hint: 'Delete',
                            icon: 'trash',
                            cssClass: 'text-danger',
                            onClick: (e) => {
                                this.handler.handleSingleDelete(e).then(() => {
                                    // Refresh grid on EditItemsForm after deletion
                                    const appForm = window.appFormInstance;
                                    appForm.formInstance._loadItems();
                                });
                            }
                        }
                    ]
                }
            );
        }

        return columns;
    }

    _getItemColumnsConfig() {
        return [
            {
                ...columnDefinitions.ITEM_CODE,
                visible: true,
                allowEditing: false
            },
            {
                ...columnDefinitions.ITEM_DESCRIPTION,
                visible: true,
                dataType: 'string',
                editorOptions: {
                    minLength: 3,
                    maxLength: 50,
                    stylingMode: 'filled',
                    showClearButton: true
                },
                validationRules: AppValidation.getDescriptionValidationRules('Item Description')
            },
            {
                ...columnDefinitions.ITEM_UNIT,
                visible: true,
                lookup: {
                    dataSource: {
                        store: this.lookupData.units,
                        sort: 'code',
                        paginate: true,
                        pageSize: 20,
                    },
                    valueExpr: 'code',
                    displayExpr: 'code',
                },
                editorOptions: {
                    stylingMode: 'filled',
                    showClearButton: true,
                    searchEnabled: true,
                },
                validationRules: [
                    {
                        type: 'required',
                        message: 'Item Unit is required'
                    }
                ]
            },
            {
                ...columnDefinitions.CONVERSION_RATE,
                visible: true,
                dataType: 'number',
                editorOptions: {
                    min: 1,
                    stylingMode: 'filled',
                    showClearButton: true,
                },
                validationRules: AppValidation.getNumberValidationRules('Conversion Rate', true, 1)
            },
            {
                ...columnDefinitions.ITEM_UNIT_PRICE,
                visible: true,
                dataType: 'number',
                format: {
                    type: 'fixedPoint',
                    precision: 4
                },
                editorOptions: {
                    min: 0.0001,
                    stylingMode: 'filled',
                    showClearButton: true,
                    format: {
                        type: 'fixedPoint',
                        precision: 4
                    },
                },
                validationRules: AppValidation.getNumberValidationRules('Item Unit Price', true, 0)
            },
            {
                ...columnDefinitions.CURRENCY,
                visible: true,
                lookup: {
                    dataSource: {
                        store: this.lookupData.currencies || [],
                        sort: 'code',
                        paginate: true,
                        pageSize: 20,
                    },
                    valueExpr: 'code',
                    displayExpr: 'code',
                },
                editorOptions: {
                    stylingMode: 'filled',
                    showClearButton: true,
                    searchEnabled: true,
                },
                validationRules: [
                    {
                        type: 'required',
                        message: 'Currency is required'
                    }
                ]
            },
            {
                ...columnDefinitions.MOQ,
                visible: true,
                dataType: 'number',
                editorOptions: {
                    min: 1,
                    stylingMode: 'filled',
                    showClearButton: true,
                },
                validationRules: AppValidation.getNumberValidationRules('MOQ', true, 1)
            },
            {
                ...columnDefinitions.LOT_SIZE,
                visible: true,
                dataType: 'number',
                editorOptions: {
                    min: 1,
                    stylingMode: 'filled',
                    showClearButton: true,
                },
                validationRules: AppValidation.getNumberValidationRules('Lot Size', true, 1)
            },
            {
                ...columnDefinitions.LEAD_TIME,
                visible: true,
                editCellTemplate: (cellElement, cellInfo) => {
                    const selectBox = $('<div>').dxSelectBox({
                        dataSource: [7, 14, 30, 60, 90, 120, 150, 180],
                        value: cellInfo.value,
                        placeholder: 'Select or Enter Lead Time',
                        acceptCustomValue: true,
                        showClearButton: true,
                        searchEnabled: true,
                        stylingMode: 'filled',
                        onCustomItemCreating: (e) => {
                            const num = parseInt(e.text);
                            e.customItem = (!isNaN(num) && num >= 1) ? num : null;
                        },
                        onValueChanged: (e) => {
                            cellInfo.setValue(e.value);
                        }
                    });
                    cellElement.append(selectBox);
                },
                validationRules: AppValidation.getNumberValidationRules('Lead Time', true, 1)
            },
            {
                ...columnDefinitions.QUOTATION_EXPIRY_DATE(this.appMain.getDateFormat()),
                visible: true,
                dataType: 'date',
                editorOptions: {
                    type: 'date',
                    stylingMode: 'filled',
                    showClearButton: true,
                    displayFormat: this.appMain.getDateFormat(),
                    onEnterKey: (e) => {
                        const inputValue = e.component._input().val();
                        const days = parseInt(inputValue);

                        if (!isNaN(days) && days > 0) {
                            const newDate = new Date();
                            newDate.setDate(newDate.getDate() + days);
                            e.component.option('value', newDate);
                        }
                    },
                    onFocusOut: (e) => {
                        const inputValue = e.component._input().val();
                        const days = parseInt(inputValue);

                        if (!isNaN(days) && days > 0 && inputValue === days.toString()) {
                            const newDate = new Date();
                            newDate.setDate(newDate.getDate() + days);
                            e.component.option('value', newDate);
                        }
                    }
                },
                validationRules: [
                    {
                        type: 'required',
                        message: 'Quotation Expiry Date is required'
                    }
                ]
            },
            {
                ...columnDefinitions.GROUP_OF_GOODS(this.lookupData),
                visible: true,
                editorOptions: {
                    stylingMode: 'filled',
                    showClearButton: true,
                    searchEnabled: true,
                },
                validationRules: [
                    {
                        type: 'required',
                        message: 'Group of Goods is required'
                    }
                ]
            }
        ];
    }

    _getMaterialColumnsConfig() {
        return [
            {
                ...columnDefinitions.MATERIAL_CODE,
                visible: false
            },
            {
                ...columnDefinitions.CATEGORY(this.lookupData),
                visible: false
            },
            {
                ...columnDefinitions.MATERIAL_TYPE(this.lookupData),
                visible: false
            },
            {
                ...columnDefinitions.MATERIAL_DESCRIPTION,
                visible: false
            },
            {
                ...columnDefinitions.MATERIAL_UNIT,
                visible: false
            },
            {
                ...columnDefinitions.MATERIAL_UNIT_PRICE,
                visible: false
            },
            {
                ...columnDefinitions.COST_CENTER,
                visible: false
            },
            {
                ...columnDefinitions.MINIMUM_ORDER,
                visible: false
            }
        ];
    }

    getConfig(mode) {
        const configs = {
            'create': this._getEditableConfig(),
            'edit': this._getEditableConfig(),
            'view': this._getViewConfig(),
            'approve': this._getViewConfig()
        };

        return configs[mode] || this._getViewConfig();
    }

    _getEditableConfig() {
        return {
            columns: this.getColumns(true),
            toolbar: this.toolbarBuilder.getEditableToolbar(() => { // onDeleteSuccess
                // Refresh grid on EditItemsForm after deletion
                const appForm = window.appFormInstance;
                if (appForm?.formInstance?._loadItems) {
                    appForm.formInstance._loadItems();
                }
            },
                () => this._onInputSuccess()
            ),
            editing: {
                mode: 'popup',
                useIcons: true,
                allowUpdating: true,
                allowDeleting: false,
                allowAdding: false,
                confirmDelete: false,
                popup: {
                    title: 'Edit Item',
                    showTitle: true,
                    width: 600,
                    height: 'auto',
                    position: { my: 'center', at: 'center', of: window },
                },
                form: {
                    colCount: 2,
                    labelLocation: 'top',
                    items: [
                        { dataField: 'item.itemDescription', colSpan: 2 },
                        { dataField: 'item.itemUnit' },
                        { dataField: 'item.conversionRate' },

                        { dataField: 'item.moq' },
                        { dataField: 'item.lotSize' },

                        { dataField: 'item.itemUnitPrice' },
                        { dataField: 'item.currency' },

                        { dataField: 'item.quotationExpiryDate' },
                        { dataField: 'item.leadTime' },

                        { dataField: 'item.groupOfGoods', colSpan: 2 }
                    ]
                }
            },
            selection: {
                mode: 'multiple',
            },
            onCellPrepared: (e) => this.onCellPrepared(e)
        };
    }

    _getViewConfig() {
        return {
            columns: this.getColumns(false),
            toolbar: this.toolbarBuilder.getViewOnlyToolbar(),
            editing: {
                allowAdding: false,
                allowDeleting: false,
                allowUpdating: false,
            },
            selection: {
                mode: 'none'
            },
            onCellPrepared: (e) => this.onCellPrepared(e)
        };
    }

    _onInputSuccess() {
        const appGrid = window.appGridInstance;
        if (!appGrid?.gridInstance) {
            console.error('Grid instance not found');
            return;
        }

        const popupId = 'inputSelectedPopup_' + Date.now();
        const popupDiv = document.createElement('div');
        popupDiv.id = popupId;
        document.body.appendChild(popupDiv);

        let formData = {};
        let formInstance;

        const popup = $(`#${popupId}`).dxPopup({
            title: 'Update Selected Items',
            showTitle: true,
            width: 800,
            height: 'auto',
            position: { my: 'center', at: 'center', of: window },
            contentTemplate: (contentElement) => {
                const formContainer = $('<div>').appendTo(contentElement);

                formInstance = formContainer.dxForm({
                    formData: formData,
                    labelLocation: 'left',
                    labelMode: 'floating',
                    showColonAfterLabel: false,
                    items: [
                        {
                            itemType: 'group',
                            colCount: 8,
                            items: [
                                // Item Description
                                {
                                    dataField: 'updateItemDescription',
                                    label: { text: ' ' },
                                    colSpan: 1,
                                    editorType: 'dxCheckBox',
                                    editorOptions: {
                                        onValueChanged: (e) => {
                                            const descField = formInstance.getEditor('itemDescription');
                                            descField.option('disabled', !e.value);
                                            if (!e.value){
                                                formData.itemDescription = null;
                                                descField.reset();
                                            }
                                        }
                                    },
                                },
                                {
                                    dataField: 'itemDescription',
                                    label: { text: 'Description' },
                                    editorType: 'dxTextBox',
                                    colSpan: 7,
                                    editorOptions: {
                                        disabled: true,
                                        stylingMode: 'filled',
                                        showClearButton: true
                                    },
                                    validationRules: [{
                                        type: 'custom',
                                        validationCallback: (e) => {
                                            if (formData.updateItemDescription && !e.value) {
                                                return false;
                                            }
                                            return true;
                                        },
                                        message: 'Item Description is required when update is checked'
                                    }, ...AppValidation.getDescriptionValidationRules('Item Description', false)]
                                },

                                // Item Unit
                                {
                                    dataField: 'updateItemUnit',
                                    label: { text: ' ' },
                                    colSpan: 1,
                                    editorType: 'dxCheckBox',
                                    editorOptions: {
                                        onValueChanged: (e) => {
                                            formInstance.getEditor('itemUnit').option('disabled', !e.value);
                                            if (!e.value){
                                                formData.itemUnit = null;
                                                formInstance.getEditor('itemUnit').reset();
                                            }
                                        }
                                    }
                                },
                                {
                                    dataField: 'itemUnit',
                                    colSpan: 3,
                                    label: { text: 'Unit' },
                                    editorType: 'dxSelectBox',
                                    editorOptions: {
                                        disabled: true,
                                        dataSource: {
                                            store: this.lookupData?.units || [],
                                            paginate: true,
                                            pageSize: 20
                                        },
                                        displayExpr: 'code',
                                        valueExpr: 'code',
                                        placeholder: 'Select Item Unit',
                                        stylingMode: 'filled',
                                        searchEnabled: true,
                                        showClearButton: true,
                                    },
                                    validationRules: [{
                                        type: 'custom',
                                        validationCallback: (e) => {
                                            if (formData.updateItemUnit && !e.value) {
                                                return false;
                                            }
                                            return true;
                                        },
                                        message: 'Item Unit is required when update is checked'
                                    }]
                                },

                                // Conversion Rate
                                {
                                    dataField: 'updateConversionRate',
                                    label: { text: ' ' },
                                    colSpan: 1,
                                    editorType: 'dxCheckBox',
                                    editorOptions: {
                                        onValueChanged: (e) => {
                                            formInstance.getEditor('conversionRate').option('disabled', !e.value);
                                            if (!e.value){
                                                formData.conversionRate = null;
                                                formInstance.getEditor('conversionRate').reset();
                                            }
                                        }
                                    }
                                },
                                {
                                    dataField: 'conversionRate',
                                    colSpan: 3,
                                    label: { text: 'Conversion Rate' },
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        disabled: true,
                                        min: 1,
                                        showClearButton: true,
                                        placeholder: 'Enter Conversion Rate',
                                        stylingMode: 'filled',
                                    },
                                    validationRules: [{
                                        type: 'custom',
                                        validationCallback: (e) => {
                                            if (formData.updateConversionRate && (e.value === null || e.value === undefined)) {
                                                return false;
                                            }
                                            return true;
                                        },
                                        message: 'Conversion Rate is required when update is checked'
                                    }, ...AppValidation.getNumberValidationRules('Conversion Rate', false, 1)]
                                },

                                // MOQ
                                {
                                    dataField: 'updateMoq',
                                    colSpan: 1,
                                    label: { text: ' ' },
                                    editorType: 'dxCheckBox',
                                    editorOptions: {
                                        onValueChanged: (e) => {
                                            formInstance.getEditor('moq').option('disabled', !e.value);
                                            if (!e.value) {
                                                formData.moq = null;
                                                formInstance.getEditor('moq').reset();
                                            }
                                        }
                                    }
                                },
                                {
                                    dataField: 'moq',
                                    colSpan: 3,
                                    label: { text: 'MOQ' },
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        disabled: true,
                                        min: 1,
                                        showClearButton: true,
                                        stylingMode: 'filled',
                                    },
                                    validationRules: [{
                                        type: 'custom',
                                        validationCallback: (e) => {
                                            if (formData.updateMoq && (e.value === null || e.value === undefined)) {
                                                return false;
                                            }
                                            return true;
                                        },
                                        message: 'MOQ is required when update is checked'
                                    }, ...AppValidation.getNumberValidationRules('MOQ', false, 1)]
                                },

                                // Lot Size
                                {
                                    dataField: 'updateLotSize',
                                    colSpan: 1,
                                    label: { text: ' ' },
                                    editorType: 'dxCheckBox',
                                    editorOptions: {
                                        onValueChanged: (e) => {
                                            formInstance.getEditor('lotSize').option('disabled', !e.value);
                                            if (!e.value) {
                                                formData.lotSize = null;
                                                formInstance.getEditor('lotSize').reset();
                                            }
                                        }
                                    }
                                },
                                {
                                    dataField: 'lotSize',
                                    colSpan: 3,
                                    label: { text: 'Lot Size' },
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        disabled: true,
                                        min: 1,
                                        showClearButton: true,
                                        stylingMode: 'filled',
                                    },
                                    validationRules: [{
                                        type: 'custom',
                                        validationCallback: (e) => {
                                            if (formData.updateLotSize && (e.value === null || e.value === undefined)) {
                                                return false;
                                            }
                                            return true;
                                        },
                                        message: 'Lot Size is required when update is checked'
                                    }, ...AppValidation.getNumberValidationRules('Lot Size', false, 1)]
                                },

                                // Item Unit Price
                                {
                                    dataField: 'updateItemUnitPrice',
                                    colSpan: 1,
                                    label: { text: ' ' },
                                    editorType: 'dxCheckBox',
                                    editorOptions: {
                                        onValueChanged: (e) => {
                                            formInstance.getEditor('itemUnitPrice').option('disabled', !e.value);
                                            if (!e.value) {
                                                formData.itemUnitPrice = null;
                                                formInstance.getEditor('itemUnitPrice').reset();
                                            }
                                        }
                                    }
                                },
                                {
                                    dataField: 'itemUnitPrice',
                                    colSpan: 3,
                                    label: { text: 'Unit Price' },
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        disabled: true,
                                        min: 0.0001,
                                        stylingMode: 'filled',
                                        showClearButton: true,
                                        format: {
                                            type: 'fixedPoint',
                                            precision: 4
                                        },
                                    },
                                    validationRules: [{
                                        type: 'custom',
                                        validationCallback: (e) => {
                                            if (formData.updateItemUnitPrice && (e.value === null || e.value === undefined)) {
                                                return false;
                                            }
                                            return true;
                                        },
                                        message: 'Item Unit Price is required when update is checked'
                                    }, ...AppValidation.getNumberValidationRules('Item Unit Price', false, 0)]
                                },

                                // Currency
                                {
                                    dataField: 'updateCurrency',
                                    colSpan: 1,
                                    label: { text: ' ' },
                                    editorType: 'dxCheckBox',
                                    editorOptions: {
                                        onValueChanged: (e) => {
                                            formInstance.getEditor('currency').option('disabled', !e.value);
                                            if (!e.value){
                                                formData.currency = null;
                                                formInstance.getEditor('currency').reset();
                                            }
                                        }
                                    }
                                },
                                {
                                    dataField: 'currency',
                                    colSpan: 3,
                                    label: { text: 'Currency' },
                                    editorType: 'dxSelectBox',
                                    editorOptions: {
                                        disabled: true,
                                        dataSource: {
                                            store: this.lookupData?.currencies || [],
                                            paginate: true,
                                            pageSize: 20
                                        },
                                        displayExpr: 'displayName',
                                        valueExpr: 'code',
                                        searchEnabled: true,
                                        showClearButton: true,
                                        stylingMode: 'filled',
                                    },
                                    validationRules: [{
                                        type: 'custom',
                                        validationCallback: (e) => {
                                            if (formData.updateCurrency && !e.value) {
                                                return false;
                                            }
                                            return true;
                                        },
                                        message: 'Currency is required when update is checked'
                                    }]
                                },

                                // Lead Time
                                {
                                    dataField: 'updateLeadTime',
                                    colSpan: 1,
                                    label: { text: ' ' },
                                    editorType: 'dxCheckBox',
                                    editorOptions: {
                                        onValueChanged: (e) => {
                                            formInstance.getEditor('leadTime').option('disabled', !e.value);
                                            if (!e.value) {
                                                formData.leadTime = null;
                                                formInstance.getEditor('leadTime').reset();
                                            }
                                        }
                                    }
                                },
                                {
                                    dataField: 'leadTime',
                                    colSpan: 3,
                                    label: { text: 'Lead Time' },
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        disabled: true,
                                        dataSource: [7, 14, 30, 60, 90, 120, 150, 180],
                                        placeholder: 'Select or Enter Lead Time',
                                        stylingMode: 'filled',
                                        showClearButton: true,
                                        acceptCustomValue: true,
                                        onCustomItemCreating: (e) => {
                                            const num = parseInt(e.text);
                                            e.customItem = (!isNaN(num) && num >= 1) ? num : null;
                                        }
                                    },
                                    validationRules: [{
                                        type: 'custom',
                                        validationCallback: (e) => {
                                            if (formData.updateLeadTime && (e.value === null || e.value === undefined)) {
                                                return false;
                                            }
                                            return true;
                                        },
                                        message: 'Lead Time is required when update is checked'
                                    }, ...AppValidation.getNumberValidationRules('Lead Time', false, 1)]
                                },

                                // Quotation Expiry Date
                                {
                                    dataField: 'updateQuotationExpiryDate',
                                    colSpan: 1,
                                    label: { text: ' ' },
                                    editorType: 'dxCheckBox',
                                    editorOptions: {
                                        onValueChanged: (e) => {
                                            formInstance.getEditor('quotationExpiryDate').option('disabled', !e.value);
                                            if (!e.value) {
                                                formData.quotationExpiryDate = null;
                                                formInstance.getEditor('quotationExpiryDate').reset();
                                            }
                                        }
                                    }
                                },
                                {
                                    dataField: 'quotationExpiryDate',
                                    colSpan: 3,
                                    label: { text: 'Quotation Expiry Date' },
                                    editorType: 'dxDateBox',
                                    editorOptions: {
                                        disabled: true,
                                        type: 'date',
                                        displayFormat: appGrid.appMain.getDateFormat(),
                                        showClearButton: true,
                                        stylingMode: 'filled',
                                        onEnterKey: (e) => {
                                            const inputValue = e.component._input().val();
                                            const days = parseInt(inputValue);

                                            if (!isNaN(days) && days > 0) {
                                                const newDate = new Date();
                                                newDate.setDate(newDate.getDate() + days);
                                                e.component.option('value', newDate);
                                            }
                                        },
                                        onFocusOut: (e) => {
                                            const inputValue = e.component._input().val();
                                            const days = parseInt(inputValue);

                                            if (!isNaN(days) && days > 0 && inputValue === days.toString()) {
                                                const newDate = new Date();
                                                newDate.setDate(newDate.getDate() + days);
                                                e.component.option('value', newDate);
                                            }
                                        }
                                    },
                                    validationRules: [{
                                        type: 'custom',
                                        validationCallback: (e) => {
                                            if (formData.updateQuotationExpiryDate && !e.value) {
                                                return false;
                                            }
                                            return true;
                                        },
                                        message: 'Quotation Expiry Date is required when update is checked'
                                    }]
                                },

                                // Group of Goods
                                {
                                    dataField: 'updateGroupOfGoods',
                                    colSpan: 1,
                                    label: { text: ' ' },
                                    editorType: 'dxCheckBox',
                                    editorOptions: {
                                        onValueChanged: (e) => {
                                            formInstance.getEditor('groupOfGoods').option('disabled', !e.value);
                                            if (!e.value) {
                                                formData.groupOfGoods = null;
                                                formInstance.getEditor('groupOfGoods').reset();
                                            }
                                        }
                                    }
                                },
                                {
                                    dataField: 'groupOfGoods',
                                    colSpan: 7,
                                    label: { text: 'Group of Goods' },
                                    editorType: 'dxSelectBox',
                                    editorOptions: {
                                        disabled: true,
                                        dataSource: {
                                            store: this.lookupData?.groupsOfGoods || [],
                                            paginate: true,
                                            pageSize: 20
                                        },
                                        displayExpr: 'displayName',
                                        valueExpr: 'id',
                                        searchEnabled: true,
                                        showClearButton: true,
                                        stylingMode: 'filled',
                                    },
                                    validationRules: [{
                                        type: 'custom',
                                        validationCallback: (e) => {
                                            if (formData.updateGroupOfGoods && !e.value) {
                                                return false;
                                            }
                                            return true;
                                        },
                                        message: 'Group of Goods is required when update is checked'
                                    }]
                                }
                            ]
                        },
                        {
                            itemType: 'button',
                            horizontalAlignment: 'right',
                            buttonOptions: {
                                text: 'Update Selected Items',
                                type: 'success',
                                width: 200,
                                onClick: () => {
                                    if (!formInstance.validate().isValid) {
                                        return;
                                    }

                                    const selectedRows = appGrid.gridInstance.getSelectedRowsData();
                                    if (selectedRows.length === 0) {
                                        appGrid.appMain.notification.warning('Please select at least one item to update');
                                        return;
                                    }

                                    // Check if any update checkbox is checked
                                    const updateFields = Object.keys(formData).filter(key => key.startsWith('update') && formData[key]);
                                    if (updateFields.length === 0) {
                                        appGrid.appMain.notification.warning('Please check at least one field to update');
                                        return;
                                    }

                                    const dataSource = appGrid.gridInstance.option('dataSource') || [];
                                    let updatedCount = 0;

                                    selectedRows.forEach(row => {
                                        const index = dataSource.findIndex(item =>
                                            item.id ? item.id === row.id : item.item?.itemCode === row.item?.itemCode
                                        );

                                        if (index !== -1 && dataSource[index].item) {
                                            // Update only checked fields
                                            const fieldMapping = {
                                                'updateItemDescription': 'itemDescription',
                                                'updateItemUnit': 'itemUnit',
                                                'updateConversionRate': 'conversionRate',
                                                'updateItemUnitPrice': 'itemUnitPrice',
                                                'updateCurrency': 'currency',
                                                'updateMoq': 'moq',
                                                'updateLotSize': 'lotSize',
                                                'updateLeadTime': 'leadTime',
                                                'updateQuotationExpiryDate': 'quotationExpiryDate',
                                                'updateGroupOfGoods': 'groupOfGoods'
                                            };

                                            Object.keys(fieldMapping).forEach(updateKey => {
                                                if (formData[updateKey]) {
                                                    const fieldKey = fieldMapping[updateKey];
                                                    dataSource[index].item[fieldKey] = formData[fieldKey];
                                                }
                                            });
                                            updatedCount++;
                                        }
                                    });

                                    appGrid.gridInstance.option('dataSource', dataSource);
                                    appGrid.gridInstance.refresh();
                                    appGrid.appMain.notification.success(`${updatedCount} item(s) updated successfully`);
                                    popup.hide();
                                }
                            }
                        }
                    ]
                }).dxForm('instance');
            },
            onHiding: () => {
                popupDiv.remove();
            }
        }).dxPopup('instance');

        popup.show();
    }

}