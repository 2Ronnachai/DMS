class NewMaterialItemsForm {
    constructor(appForm, container, applicationData = null) {
        this.appForm = appForm;
        this.container = container;
        this.data = applicationData;

        this.formInstance = null;
        this.sessionKey = 'newmaterialsitems_lastSelected';

        this.lookupData = {
            categories: [],
            materialTypes: [],
            units: [],
            exchangeRates: [],
            groupOfGoods: []
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
            console.error('Error rendering NewMaterialItemsForm:', error);
        }
    }

    async _loadLookupDataSources() {
        let [categories, materialTypes, units, exchangeRates, groupOfGoods] = await Promise.all([
            this.appForm.appMain.formComponents.getCategoryDataSource(),
            this.appForm.appMain.formComponents.getMaterialTypeDataSource(),
            this.appForm.appMain.formComponents.getUnitDataSource(),
            this.appForm.appMain.formComponents.getExchangeRatesDataSource(),
            this.appForm.appMain.formComponents.getGroupOfGoodsDataSource()
        ]);

        // Default Lookup Data
        if (!exchangeRates || exchangeRates.length === 0) {
            exchangeRates = [{ id: 'THB', code: 'THB', displayName: 'THB (1.0000)', rateToTHB: 1 }];
        }

        this.lookupData = {
            categories,
            materialTypes,
            units,
            exchangeRates,
            groupOfGoods
        };
    }

    _renderForm() {
        const formContainer = document.createElement('div');
        formContainer.className = 'material-form-and-items-form';
        formContainer.innerHTML = `
            <div class="category-material-selection mt-3">
                <div id="newMaterialAndItemsForm"></div>
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
        this.container.append(formContainer);

        this._renderNewMaterialAndItemsForm();
        this._renderButtons();
    }

    _renderNewMaterialAndItemsForm() {
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

        let calculateTimeout = null;

        // Helper: Calculated THB Unit Price
        const calculateTHBUnitPrice = async () => {
            const formData = this.formInstance.option('formData');
            const itemUnitPrice = formData.itemUnitPrice || 0;
            const currency = formData.currency || 'THB';
            const exchangeRates = this.lookupData.exchangeRates || [];
            const selectedRate = exchangeRates.find(r => r.code === currency);
            if (selectedRate) {
                const thbUnitPrice = itemUnitPrice * selectedRate.rateToTHB;
                this.update('materialUnitPrice', thbUnitPrice);
            }
        };

        const formConfig = {
            formData: {
                minimunOrder: 1,
                conversionRate: 1,
                itemUnitPrice: 0,
                moq: 1,
                lotSize: 1,
                leadTime: 7,
                quotationExpiryDate: new Date(),
                materialUnitPrice: 0,
                currency: 'THB',
                groupOfGoods: 1
            },
            labelLocation: 'top',
            showColonAfterLabel: false,
            colCount: 2,
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
                                const selectedCategory = this.lookupData.categories.find(cat => cat.id === e.value);
                                if (selectedCategory) {
                                    this.update('costCenter', selectedCategory.costCenter);
                                }

                                this.saveToSession();
                            } else {
                                this.update('costCenter', null);
                            }
                        },
                        stylingMode: 'filled'
                    },
                    validationRules: [
                        {
                            type: 'required',
                            message: 'Category is required'
                        }
                    ]
                },
                {
                    dataField: 'materialTypeId',
                    label: { text: 'Material Type' },
                    editorType: 'dxSelectBox',
                    editorOptions: {
                        dataSource: {
                            store: this.lookupData.materialTypes || [],
                            paginate: true,
                            pageSize: 20
                        },
                        displayExpr: 'displayName',
                        valueExpr: 'id',
                        placeholder: 'Select Material Type',
                        searchEnabled: true,
                        showClearButton: true,
                        onValueChanged: (e) => {
                            if (e.value) {
                                this.saveToSession();
                            }
                        },
                        stylingMode: 'filled'
                    },
                    validationRules: [
                        {
                            type: 'required',
                            message: 'Material Type is required'
                        }
                    ]
                },
                {
                    itemType: 'empty',
                    colSpan: 2,
                    cssClass: 'form-divider',
                },
                {
                    itemType: 'group', // Material Details Group
                    colCount: 1,
                    colSpan: 1,
                    items: [
                        {
                            dataField: 'materialDescription',
                            label: { text: 'Material Description' },
                            editorType: 'dxTextBox',
                            editorOptions: {
                                placeholder: 'Enter Material Description',
                                stylingMode: 'filled',
                                showClearButton: true,
                                onValueChanged: (e) => {
                                    const newValue = e.value;
                                    this.update('itemDescription', newValue);
                                }
                            },
                            validationRules: getDescriptionValidationRules('Material Description')
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
                                placeholder: 'Select Material Unit',
                                stylingMode: 'filled',
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
                            validationRules: [
                                {
                                    type: 'required',
                                    message: 'Material Unit is required'
                                }
                            ]
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
                                stylingMode: 'filled',
                                showClearButton: true
                            },
                            validationRules: getNumberValidationRules('Minimum Order Quantity', true, 1)
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
                        }
                    ]
                },
                {
                    itemType: 'group', // Items Details Group
                    colCount: 4,
                    colSpan: 1,
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
                            colSpan: 1,
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
                            colSpan: 1,
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
                            colSpan: 1,
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
                            colSpan: 1,
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
                                onValueChanged: (e) => {
                                    if (calculateTimeout) {
                                        clearTimeout(calculateTimeout);
                                    }
                                    calculateTimeout = setTimeout(() => {
                                        if (e.value !== null && e.value !== undefined) {
                                            calculateTHBUnitPrice();
                                        } else {
                                            this.update('materialUnitPrice', 0);
                                        }
                                    }, 300);
                                }
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

                                        calculateTHBUnitPrice();
                                    } else {
                                        this.update('materialUnitPrice', 0);
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
                        }
                    ]
                },
            ]
        };

        const selectionFormContainer = this.container.querySelector('#newMaterialAndItemsForm');
        this.formInstance = $(selectionFormContainer).dxForm(formConfig).dxForm('instance');
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
                    this.reset();
                    this.clearSession();
                }
            });
        });

        this.container.querySelector('#addBtn').addEventListener('click', () => {
            if (this.validate().isValid) {
                const formData = this.prepareDataForSubmission();
                this.appForm.appMain.onSubmitNewMaterialsItems(formData);
            }
        });
    }

    _calculateTHBUnitPrice() {
        if (!this.formInstance) return;
        const formData = this.get();
        const itemUnitPrice = formData.itemUnitPrice || 0;
        const currency = formData.currency || 'THB';
        const exchangeRates = this.lookupData.exchangeRates || [];
        const selectedRate = exchangeRates.find(r => r.code === currency);
        if (selectedRate) {
            const thbUnitPrice = itemUnitPrice * selectedRate.rateToTHB;
            this.update('materialUnitPrice', thbUnitPrice);
        }
    }

    prepareDataForSubmission() {
        this._calculateTHBUnitPrice();
        const formData = this.get();
        console.log('Before preparation, data is:', formData);

        // For example, format dates, convert types, etc.
        const preparedData = {
            categoryId: formData.categoryId,
            materialTypeId: formData.materialTypeId,
            materialDescription: formData.materialDescription,
            materialUnit: formData.materialUnit,
            materialUnitPrice: formData.materialUnitPrice,
            minimunOrder: formData.minimunOrder,
            costCenter: formData.costCenter,
            runningNumber: 0, // Default running number
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
                runningNumber: 0 // Default running number
            }
        };

        console.log('After preparation, data is:', preparedData);
        return preparedData;
    }

    saveToSession() {
        try {
            const formData = this.get();
            const dataToSave = {
                categoryId: formData.categoryId,
                materialTypeId: formData.materialTypeId
            };
            sessionStorage.setItem(this.sessionKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Failed to save to session:', error);
        }
    }

    loadFromSession() {
        try {
            const savedData = sessionStorage.getItem(this.sessionKey);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (parsedData.categoryId) {
                    this.update('categoryId', parsedData.categoryId);

                    // Trigger cost center update
                    const selectedCategory = this.lookupData.categories?.find(
                        cat => cat.id === parsedData.categoryId
                    );
                    if (selectedCategory) {
                        this.update('costCenter', selectedCategory.costCenter);
                    }
                }

                if (parsedData.materialTypeId) {
                    this.update('materialTypeId', parsedData.materialTypeId);
                }
            }
        } catch (error) {
            console.error('Failed to load from session:', error);
        }
    }

    clearSession() {
        try {
            sessionStorage.removeItem(this.sessionKey);
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
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
        }
    }

    validate() {
        if (this.formInstance) {
            return this.formInstance.validate();
        }
    }
}