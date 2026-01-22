class NewItemForm {
    constructor(appForm, container, applicationData = null) {
        this.appForm = appForm;
        this.container = container;
        this.data = applicationData;

        this.formInstance = null;

        this.sessionKey = 'newitems_lastSelected';
        this.lookupData = {
            categories: [],
            units: [],
            exchangeRates: [],
            groupOfGoods: [],
            materials: []
        };
    }

    async render() {
        try {
            await this._loadLookupDataSources();
            this.container.innerHTML = '';
            this._renderForm();

            setTimeout(() => {
                this.loadFromSession();
            }, 300);
        } catch (error) {
            console.error('Failed to render NewItemsForm:', error);
        }
    }

    async _loadLookupDataSources() {
        let [categories, units, exchangeRates, groupOfGoods] = await Promise.all([
            this.appForm.appMain.formComponents.getCategoryDataSource(),
            this.appForm.appMain.formComponents.getUnitDataSource(),
            this.appForm.appMain.formComponents.getExchangeRatesDataSource(),
            this.appForm.appMain.formComponents.getGroupOfGoodsDataSource()
        ]);

        if (!exchangeRates || exchangeRates.length === 0) {
            exchangeRates = [{ id: 'THB', code: 'THB', displayName: 'THB (1.0000)', rateToTHB: 1 }];
        }

        this.lookupData = {
            categories,
            units,
            exchangeRates,
            groupOfGoods
        };
    }

    _renderForm() {
        const formContainer = document.createElement('div');
        formContainer.className = 'new-items-form';
        formContainer.innerHTML = `
            <div class="category-material-selection mt-3">
                <div id="newItemForm"></div>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button type="button" class="dialog-btn dialog-btn-cancel" id="resetBtn">
                        <i class="fas fa-undo"></i> Reset
                    </button>
                    <button type="button" class="dialog-btn dialog-info dialog-btn-ok" id="addBtn">
                        <i class="fas fa-plus"></i> Add Item
                    </button>
                </div>
            </div>
        `;
        this.container.appendChild(formContainer);

        this._renderNewItemsForm();
        this._renderButtons();
    }

    _renderNewItemsForm() {
        // Helper: Description Validation Rules
        const getDescriptionValidationRules = (fieldName) => {
            return [
                {
                    type: 'required',
                    message: `${fieldName} is required`
                },
                {
                    type: 'stringLength',
                    min: 3,
                    max: 50,
                    message: 'Description must be between 3 and 50 characters'
                },
                {
                    type: 'custom',
                    validationCallback: (e) => {
                        if (!e.value) return true;

                        if (/['"]/.test(e.value)) {
                            e.rule.message = 'Single quotes (\') and double quotes (") are not allowed';
                            return false;
                        }

                        if (!/^[a-zA-Z0-9!%&()*\-./#:=@_ ]+$/.test(e.value)) {
                            e.rule.message = 'Only letters, numbers and special characters (!%&()*-./#:=@_) are allowed';
                            return false;
                        }

                        return true;
                    }
                }
            ];
        };

        // Helper: Number Validation Rules
        const getNumberValidationRules = (fieldName, isRequired = true, minValue = null, maxValue = null) => {
            const rules = [];

            if (isRequired) {
                rules.push({
                    type: 'required',
                    message: `${fieldName} is required`
                });
            }

            if (minValue !== null && maxValue !== null) {
                rules.push({
                    type: 'numeric',
                    message: `${fieldName} must be a valid number`
                });
                rules.push({
                    type: 'range',
                    min: minValue,
                    max: maxValue,
                    message: `${fieldName} must be between ${minValue} and ${maxValue}`
                });
            } else if (minValue !== null) {
                rules.push({
                    type: 'numeric',
                    message: `${fieldName} must be a valid number`
                });
                rules.push({
                    type: 'range',
                    min: minValue,
                    message: `${fieldName} must be at least ${minValue}`
                });
            } else if (maxValue !== null) {
                rules.push({
                    type: 'numeric',
                    message: `${fieldName} must be a valid number`
                });
                rules.push({
                    type: 'range',
                    max: maxValue,
                    message: `${fieldName} must be at most ${maxValue}`
                });
            }
            return rules;
        };

        // Helper: Currency Format
        const getCurrencyFormat = (currency = 'THB', precision = 4) => {
            return {
                type: 'fixedPoint',
                precision: precision,
                formatter: (value) => {
                    if (value === null || value === undefined) return '';
                    return `${value.toLocaleString('en-US', {
                        minimumFractionDigits: precision,
                        maximumFractionDigits: precision
                    })} ${currency}`;
                }
            };
        };

        // Cascading lookup Category and Material Type => Material
        const formConfig = {
            formData: {
                categoryId: null,
                materialTypeId: null,
                materialId: null,
                minimunOrder: 1,
                conversionRate: 1,
                itemUnitPrice: 0,
                moq: 1,
                lotSize: 1,
                leadTime: 7,
                quotationExpiryDate: new Date(),
                materialUnitPrice: 0,
                currency: 'THB',
                groupOfGoods: 1,
                runningNumber: 1
            },
            colCount: 2,
            labelLocation: 'top',
            showColonAfterLabel: false,
            items: [
                {
                    dataField: 'categoryId',
                    label: { text: 'Category' },
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        dataSource: {
                            store: this.lookupData.categories || [],
                            paginate: true,
                            pageSize: 20
                        },
                        displayExpr: 'displayName',
                        valueExpr: 'id',
                        placeholder: 'Select Category',
                        searchEnabled: true,
                        showClearButton: true,
                        onValueChanged: (e) => {
                            if (e.value) {
                                this.appForm.appMain.formComponents.getMaterialTypeDataSource(e.value).then(materialTypes => {
                                    const materialTypeEditor = this.formInstance.getEditor('materialTypeId');
                                    materialTypeEditor.option('dataSource', {
                                        store: materialTypes,
                                        paginate: true,
                                        pageSize: 20
                                    });
                                    materialTypeEditor.option('value', null);
                                });
                            } else {
                                const materialTypeEditor = this.formInstance.getEditor('materialTypeId');
                                materialTypeEditor.option('dataSource', {
                                    store: [],
                                    paginate: true,
                                    pageSize: 20
                                });
                                materialTypeEditor.option('value', null);
                            }
                        }
                    },
                    validationRules: [
                        { type: 'required', message: 'Category is required.' }
                    ]
                },
                {
                    dataField: 'materialTypeId',
                    label: { text: 'Material Type' },
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        dataSource: { store: [], paginate: true, pageSize: 20 },
                        displayExpr: 'displayName',
                        valueExpr: 'id',
                        placeholder: 'Select Category first',
                        searchEnabled: true,
                        showClearButton: true,
                        onValueChanged: (e) => {
                            if (e.value) {
                                this.appForm.appMain.formComponents.getMaterialDataSource(
                                    this.formInstance.option('formData').categoryId,
                                    e.value
                                ).then(materials => {
                                    this.lookupData.materials = materials;
                                    const materialEditor = this.formInstance.getEditor('materialCode');
                                    materialEditor.option('dataSource', {
                                        store: materials,
                                        paginate: true,
                                        pageSize: 20
                                    });
                                    materialEditor.option('value', null);
                                });
                            } else {
                                const materialEditor = this.formInstance.getEditor('materialCode');
                                materialEditor.option('dataSource', {
                                    store: [],
                                    paginate: true,
                                    pageSize: 20
                                });
                                materialEditor.option('value', null);
                            }
                        }
                    },
                    validationRules: [
                        { type: 'required', message: 'Material Type is required.' }
                    ]
                },
                {
                    itemType: 'empty',
                    colSpan: 2,
                    cssClass: 'form-divider',
                },
                {
                    itemType: 'group', // Material Details Group
                    colSpan: 1,
                    colCount: 1,
                    items: [
                        {
                            dataField: 'materialCode',
                            label: { text: 'Material' },
                            editorType: 'dxSelectBox',
                            editorOptions: {
                                dataSource: { store: [], paginate: true, pageSize: 20 },
                                displayExpr: item => item ? `${item.code} (${item.description})` : '',
                                valueExpr: 'code',
                                placeholder: 'Seletct Material Type first',
                                searchEnabled: true,
                                showClearButton: true,
                                onValueChanged: (e) => {
                                    if (e.value) {
                                        const selectedMaterial = this.lookupData.materials.find(m => m.code === e.value);
                                        this.update('materialDescription', selectedMaterial ? selectedMaterial.description : '');
                                        this.update('materialUnit', selectedMaterial ? selectedMaterial.unit : '');
                                        this.update('materialUnitPrice', selectedMaterial ? selectedMaterial.unitPrice : 0);
                                        this.update('minimunOrder', selectedMaterial ? selectedMaterial.minimumOrder : 1);
                                        this.update('costCenter', selectedMaterial ? selectedMaterial.costCenter : '');
                                        this.update('materialRunningNumber', selectedMaterial ? selectedMaterial.runningNumber : null);
                                    } else {
                                        this.update('materialDescription', '');
                                        this.update('materialUnit', '');
                                        this.update('materialUnitPrice', 0);
                                        this.update('minimunOrder', 1);
                                        this.update('costCenter', '');
                                        this.update('materialRunningNumber', null);
                                    }
                                }
                            },
                            validationRules: [
                                { type: 'required', message: 'Material is required.' }
                            ]
                        },
                        {
                            dataField: 'materialDescription',
                            label: { text: 'Material Description' },
                            editorType: 'dxTextBox',
                            editorOptions: {
                                placeholder: 'Description will be auto-filled',
                                stylingMode: 'outlined',
                                showClearButton: true,
                                readOnly: true,
                                onValueChanged: (e) => {
                                    const newValue = e.value;
                                    this.update('itemDescription', newValue);
                                }
                            },
                        },
                        {
                            dataField: 'materialUnit',
                            label: { text: 'Unit' },
                            editorType: 'dxSelectBox',
                            editorOptions: {
                                dataSource: {
                                    store: this.lookupData.units || [],
                                    paginate: true,
                                    pageSize: 20
                                },
                                displayExpr: 'displayName',
                                valueExpr: 'code',
                                placeholder: 'Unit will be auto-filled',
                                stylingMode: 'outlined',
                                readOnly: true,
                                searchEnabled: true,
                                showClearButton: true,
                                onValueChanged: (e) => {
                                    const newValue = e.value;
                                    const formData = this.formInstance.option('formData');

                                    if (newValue && formData.itemUnit !== newValue) {
                                        this.update('itemUnit', newValue);
                                    }

                                    if (!e.value) {
                                        this.update('itemUnit', null);
                                    }
                                }
                            },
                        },
                        {
                            // Calculated Field: with Unit Price * Conversion Rate
                            dataField: 'materialUnitPrice',
                            colSpan: 1,
                            label: { text: 'Unit Price (THB)' },
                            editorType: 'dxNumberBox',
                            editorOptions: {
                                readOnly: true,
                                stylingMode: 'outlined',
                                format: getCurrencyFormat('THB', 4)
                            }
                        },
                        {
                            dataField: 'minimunOrder',
                            label: () => {
                                return {
                                    text: 'Minimum Order Quantity',
                                    alignment: 'left'
                                };
                            },
                            editorType: 'dxNumberBox',
                            editorOptions: {
                                min: 1,
                                placeholder: 'Enter Minimum Order Quantity',
                                stylingMode: 'outlined',
                                readOnly: true,
                                showClearButton: true
                            },
                        },
                        {
                            dataField: 'costCenter',
                            label: { text: 'Cost Center' },
                            editorType: 'dxTextBox',
                            editorOptions: {
                                readOnly: true,
                                stylingMode: 'outlined',
                                placeholder: 'Cost Center will be auto-filled',
                                showClearButton: true
                            }
                        },
                        {
                            dataField: 'materialRunningNumber',
                            visible: false
                        },
                        {
                            dataField: 'materialCode',
                            visible: false
                        },
                    ]
                },
                {
                    itemType: 'group', // Item Details Group
                    colSpan: 1,
                    colCount: 4,
                    items: [
                        {
                            dataField: 'itemDescription',
                            colSpan: 4,
                            label: { text: 'Item Description' },
                            editorType: 'dxTextBox',
                            editorOptions: {
                                placeholder: 'Enter Item Description',
                                stylingMode: 'filled',
                                showClearButton: true
                            },
                            validationRules: getDescriptionValidationRules('Item Description')
                        },
                        {
                            dataField: 'itemUnit',
                            colSpan: 2,
                            label: { text: 'Unit' },
                            editorType: 'dxSelectBox',
                            editorOptions: {
                                dataSource: {
                                    store: this.lookupData.units || [],
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
                            validationRules: [
                                {
                                    type: 'required',
                                    message: 'Item Unit is required'
                                }
                            ]
                        },
                        {
                            dataField: 'conversionRate',
                            colSpan: 2,
                            label: { text: 'Conversion Rate' },
                            editorType: 'dxNumberBox',
                            editorOptions: {
                                min: 1,
                                placeholder: 'Enter Conversion Rate',
                                stylingMode: 'filled',
                                showClearButton: true
                            },
                            validationRules: getNumberValidationRules('Conversion Rate', true, 1)
                        },
                        {
                            dataField: 'moq',
                            colSpan: 2,
                            label: { text: 'MOQ' },
                            editorType: 'dxNumberBox',
                            editorOptions: {
                                min: 1,
                                placeholder: 'Enter MOQ',
                                stylingMode: 'filled',
                                showClearButton: true
                            },
                            validationRules: getNumberValidationRules('MOQ', true, 1)
                        },
                        {
                            dataField: 'lotSize',
                            colSpan: 2,
                            label: { text: 'Lot Size' },
                            editorType: 'dxNumberBox',
                            editorOptions: {
                                min: 1,
                                placeholder: 'Enter Lot Size',
                                stylingMode: 'filled',
                                showClearButton: true
                            },
                            validationRules: getNumberValidationRules('Lot Size', true, 1)
                        },
                        {
                            dataField: 'itemUnitPrice',
                            colSpan: 2,
                            label: { text: 'Unit Price' },
                            editorType: 'dxNumberBox',
                            editorOptions: {
                                min: 0.0001,
                                placeholder: 'Enter Unit Price',
                                stylingMode: 'filled',
                                showClearButton: true,
                                format: getCurrencyFormat('THB', 4),
                            },
                            validationRules: getNumberValidationRules('Unit Price', true, 0.0001)
                        },
                        {
                            dataField: 'currency',
                            colSpan: 2,
                            label: { text: 'Currency' },
                            editorType: 'dxSelectBox',
                            editorOptions: {
                                dataSource: {
                                    store: this.lookupData.exchangeRates || [],
                                    paginate: true,
                                    pageSize: 20
                                },
                                displayExpr: 'displayName',
                                valueExpr: 'code',
                                placeholder: 'Select Currency',
                                stylingMode: 'filled',
                                searchEnabled: true,
                                showClearButton: true,
                                onValueChanged: (e) => {
                                    if (e.value) {
                                        const unitPriceEditor = this.formInstance.getEditor('itemUnitPrice');
                                        if (unitPriceEditor) {
                                            unitPriceEditor.option('format', getCurrencyFormat(e.value, 4));
                                        }
                                    }
                                }
                            },
                            validationRules: [
                                {
                                    type: 'required',
                                    message: 'Currency is required'
                                }
                            ]
                        },
                        {
                            dataField: 'quotationExpiryDate',
                            colSpan: 2,
                            label: { text: 'Quotation Expiry Date' },
                            editorType: 'dxDateBox',
                            editorOptions: {
                                type: 'date',
                                placeholder: 'Select Quotation Expiry Date',
                                stylingMode: 'filled',
                                showClearButton: true,
                                displayFormat: this.appForm.appMain.getDateFormat(),
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
                            dataField: 'leadTime',
                            colSpan: 2,
                            label: { text: 'Lead Time (Days)' },
                            editorType: 'dxSelectBox',
                            editorOptions: {
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
                            validationRules: getNumberValidationRules('Lead Time', true, 1)
                        },
                        {
                            dataField: 'groupOfGoods',
                            colSpan: 4,
                            label: { text: 'Group of Goods' },
                            editorType: 'dxSelectBox',
                            editorOptions: {
                                dataSource: this.lookupData.groupOfGoods || [],
                                displayExpr: 'displayName',
                                valueExpr: 'id',
                                placeholder: 'Select Group of Goods',
                                stylingMode: 'filled',
                                showClearButton: true,
                                searchEnabled: true
                            },
                            validationRules: [
                                {
                                    type: 'required',
                                    message: 'Group of Goods is required'
                                }
                            ]
                        },
                        {
                            dataField: 'itemRunningNumber',
                            visible: false
                        },
                        {
                            dataField: 'itemCode',
                            visible: false
                        }
                    ]
                }
            ]
        }

        this.formInstance = new DevExpress.ui.dxForm(
            this.container.querySelector('#newItemForm'),
            formConfig
        );
    }

    //Method to save current selected values
    saveToSession(){
        if (this.formInstance) {
            const formData = this.formInstance.option('formData');
            const lastSelectedValues = {
                categoryId: formData.categoryId,
                materialTypeId: formData.materialTypeId
            };
            sessionStorage.setItem(this.sessionKey, JSON.stringify(lastSelectedValues));
        }
    }

    async loadFromSession(){
        try{
            const saved = sessionStorage.getItem(this.sessionKey);
            if (!saved) return;

            const data = JSON.parse(saved);
            console.log('Loaded from session:', data);

            if (!this.formInstance) return;
            if (data.categoryId) {
                this.update('categoryId', data.categoryId);

                if(data.materialTypeId){
                    const materialTypes = await this.appForm.appMain.formComponents.getMaterialTypeDataSource(data.categoryId);
                    
                    const materialTypeEditor = this.formInstance.getEditor('materialTypeId');
                    materialTypeEditor.option('dataSource', {
                        store: materialTypes,
                        paginate: true,
                        pageSize: 20
                    });

                    this.update('materialTypeId', data.materialTypeId);
                }
            }
        }catch(error){
            console.error('Failed to load from session:', error);
        }
    }

    _renderButtons() {
        this.container.querySelector('#resetBtn').addEventListener('click', () => {
            this.appForm.appMain.dialog.confirm({
                title: 'Confirm Reset',
                message: 'Are you sure you want to reset the form?',
                okText: 'Reset',
                type: 'warning'
            }).then((confirmed) => {
                if (confirmed) {
                    this.clearSession();
                    this.reset();
                }
            });
        });

        this.container.querySelector('#addBtn').addEventListener('click', async () => {
            if (this.validate().isValid) {
                const preparedData = this.prepareDataForSubmission();
                this.appForm.appMain.onSubmitNewItems(preparedData);
            }
        });
    }

    prepareDataForSubmission() {
        this.saveToSession();

        const formData = this.get();
        console.log('Preparing data for submission:', formData);

        const preparedData = {
            categoryId: formData.categoryId,
            materialTypeId: formData.materialTypeId,
            materialDescription: formData.materialDescription,
            materialUnit: formData.materialUnit,
            materialUnitPrice: formData.materialUnitPrice,
            minimunOrder: formData.minimunOrder,
            costCenter: formData.costCenter,
            materialRunningNumber: formData.materialRunningNumber,
            materialCode: formData.materialCode,
            item: {
                itemDescription: formData.itemDescription,
                itemUnit: formData.itemUnit,
                itemUnitPrice: formData.itemUnitPrice,
                moq: formData.moq,
                lotSize: formData.lotSize,
                currency: formData.currency,
                conversionRate: formData.conversionRate,
                leadTime: formData.leadTime,
                quotationExpiryDate: formData.quotationExpiryDate,
                groupOfGoods: formData.groupOfGoods,
                itemRunningNumber: formData.itemRunningNumber,
                itemCode: formData.itemCode
            }
        };

        console.log('Prepared data:', preparedData);
        return preparedData;
    }

    update(fieldName, value) {
        if (this.formInstance) {
            this.formInstance.updateData(fieldName, value);
        }
    }

    get() {
        if (this.formInstance) {
            return this.formInstance.option('formData');
        }
    }

    set(data) {
        if (this.formInstance) {
            this.formInstance.option('formData', data);
        }
    }

    reset() {
        if (this.formInstance) {
            this.formInstance.reset();

            setTimeout(() => {
                this.loadFromSession();
            }, 100);
        }
    }

    clearSession() {
        sessionStorage.removeItem(this.sessionKey);
    }

    validate() {
        if (this.formInstance) {
            return this.formInstance.validate();
        }
    }
}