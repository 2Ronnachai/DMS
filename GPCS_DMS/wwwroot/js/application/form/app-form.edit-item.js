class EditItemForm {
    constructor(appForm, container, applicationData = null) {
        this.appForm = appForm;
        this.container = container;
        this.data = applicationData;

        this.formInstance = null;
        this.gridInstance = null;

        this.currentSupplier = null;
        this.sessionKey = `${this.appForm.appMain.applicationType.toLowerCase()}_lastSelected`;

        this._isLoadingFromSession = false;
        this._isChangingSupplier = false;

        this.lookupData = {
            units: [],
            exchangeRates: [],
            groupOfGoods: [],
            categories: []
        };
    }

    async render() {
        try {
            await this._loadLookupDataSource();
            this.container.innerHTML = '';
            this._renderForm();

            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    setTimeout(resolve, 200);
                });
            });

            await this.loadFromSession();
        } catch (error) {
            console.error('Error loading lookup data sources:', error);
        }
    }

    async _loadLookupDataSource() {
        let [units, exchangeRates, groupOfGoods] = await Promise.all([
            this.appForm.appMain.formComponents.getUnitDataSource(),
            this.appForm.appMain.formComponents.getExchangeRatesDataSource(),
            this.appForm.appMain.formComponents.getGroupOfGoodsDataSource()
        ]);

        if (!exchangeRates || exchangeRates.length === 0) {
            exchangeRates = [{ id: 'THB', code: 'THB', displayName: 'THB (1.0000)', rateToTHB: 1 }];
        }

        this.lookupData = {
            units,
            exchangeRates,
            groupOfGoods,
            categories: []
        };
    }

    _renderForm() {
        const formContainer = document.createElement('div');
        formContainer.className = 'edit-items-form';
        formContainer.innerHTML = `
            <div class="category-material-selection mt-3">
                <div id="editItemForm"></div>
                <div id="editItemsGrid" class="edit-items-grid mt-3"></div>
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

        this._renderEditItemsForm();
        this._renderEditItemsGrid();
        this._renderButtons();
    }

    _renderEditItemsForm() {
        const formConfig = {
            formData: {
                categoryId: null,
                materialTypeId: null
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
                            store: [],
                            paginate: true,
                            pageSize: 20
                        },
                        displayExpr: 'displayName',
                        valueExpr: 'id',
                        placeholder: 'Select Supplier first',
                        searchEnabled: true,
                        showClearButton: true,
                        disabled: true,
                        onValueChanged: async (e) => {
                            if (e.value) {
                                await this._loadMaterialTypes(e.value);
                            } else {
                                // Clear Material Type
                                const materialTypeEditor = this.formInstance.getEditor('materialTypeId');
                                if (materialTypeEditor) {
                                    materialTypeEditor.option('dataSource', { store: [], paginate: true, pageSize: 20 });
                                    materialTypeEditor.option('disabled', true);
                                    materialTypeEditor.option('value', null);
                                }
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
                        disabled: true,
                        onValueChanged: async (e) => {
                            if (e.value && this.formInstance.option('formData').categoryId) {
                                await this._loadItems();
                            }
                        }
                    },
                    validationRules: [
                        { type: 'required', message: 'Material Type is required.' }
                    ]
                },
            ]
        };

        this.formInstance = $('#editItemForm').dxForm(formConfig).dxForm('instance');
    }

    async onSupplierChange(supplier) {
        this.currentSupplier = supplier;
        this._isChangingSupplier = true;
        try {
            this.clearSession();
            if (supplier && supplier.code) {
                // Load Categories for the selected supplier
                await this._loadCategories(supplier.code);
                // Reset form fields
                this.update('categoryId', null);
                this.update('materialTypeId', null);
                // Reset Material Type editor
                const materialTypeEditor = this.formInstance.getEditor('materialTypeId');
                if (materialTypeEditor) {
                    materialTypeEditor.option('dataSource', { store: [], paginate: true, pageSize: 20 });
                    materialTypeEditor.option('disabled', true);
                    materialTypeEditor.option('value', null);
                }

                // Clear grid
                if (this.gridInstance) {
                    this.gridInstance.option('dataSource', []);
                }
            } else {
                const categoryEditor = this.formInstance.getEditor('categoryId');
                const materialTypeEditor = this.formInstance.getEditor('materialTypeId');

                if (categoryEditor) {
                    categoryEditor.option('dataSource', { store: [], paginate: true, pageSize: 20 });
                    categoryEditor.option('disabled', true);
                    categoryEditor.option('value', null);
                    categoryEditor.option('placeholder', 'Select Supplier first');
                }

                if (materialTypeEditor) {
                    materialTypeEditor.option('dataSource', { store: [], paginate: true, pageSize: 20 });
                    materialTypeEditor.option('disabled', true);
                    materialTypeEditor.option('value', null);
                }

                // Clear grid
                if (this.gridInstance) {
                    this.gridInstance.option('dataSource', []);
                }
            }
        } finally {
            this._isChangingSupplier = false;
        }
    }

    async _loadCategories(supplierCode) {
        const loadingId = this.appForm.appMain.loading.show('Loading categories...');
        try {
            const categories = await this.appForm.appMain.formComponents.getCategoryDataSource(supplierCode);
            this.lookupData.categories = categories || [];

            const categoryEditor = this.formInstance.getEditor('categoryId');
            if (categoryEditor) {
                categoryEditor.option('dataSource', {
                    store: this.lookupData.categories,
                    paginate: true,
                    pageSize: 20
                });
                categoryEditor.option('disabled', false);
                categoryEditor.option('placeholder', 'Select Category');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.appForm.appMain.notification.error('Failed to load categories');
        } finally {
            this.appForm.appMain.loading.hide(loadingId);
        }
    }

    async _loadMaterialTypes(categoryId) {
        const loadingId = this.appForm.appMain.loading.show('Loading material types...');
        try {
            const materialTypes = await this.appForm.appMain.formComponents.getMaterialTypeDataSourceWithoutSupplier(categoryId, this.currentSupplier ? this.currentSupplier.code : null);
            const materialTypeEditor = this.formInstance.getEditor('materialTypeId');
            if (materialTypeEditor) {
                ``
                materialTypeEditor.option('dataSource', {
                    store: materialTypes || [],
                    paginate: true,
                    pageSize: 20
                });
                materialTypeEditor.option('disabled', false);
                materialTypeEditor.option('placeholder', 'Select Material Type');
                materialTypeEditor.option('value', null);
            }
        } catch (error) {
            console.error('Error loading material types:', error);
            this.appForm.appMain.notification.error('Failed to load material types');
        } finally {
            this.appForm.appMain.loading.hide(loadingId);
        }
    }

    async _loadItems() {
        const loadingId = this.appForm.appMain.loading.show('Loading items...');
        const formData = this.get();
        const supplierCode = this.currentSupplier ? this.currentSupplier.code : null;

        if (!supplierCode || !formData.categoryId || !formData.materialTypeId) {
            return;
        }

        const payload = {
            supplierCode: supplierCode,
            categoryId: formData.categoryId,
            materialTypeId: formData.materialTypeId
        };

        try {
            const items = await this.appForm.appMain.formComponents.getItemsDataSource(payload);

            const existingItems = this.appForm.appMain.grid.get() || [];

            // Filter out items that are already in the main grid
            const filteredItems = (items || []).filter(item => {
                return !existingItems.some(existing =>
                    existing.item?.itemCode === item.code
                );
            });

            this.updateGridData(filteredItems || []);
        } catch (error) {
            console.error('Error loading items:', error);
            this.appForm.appMain.notification.error('Failed to load items');
        } finally {
            this.appForm.appMain.loading.hide(loadingId);
        }
    }

    _renderEditItemsGrid() {
        const gridConfig = {
            dataSource: [],
            selection: {
                mode: 'multiple',
            },
            showBorders: true,
            showRowLines: true,
            showColumnLines: true,
            allowColumnReordering: true,
            columnAutoWidth: true,
            columnFixing: { enabled: true },
            hoverStateEnabled: true,
            paging: { pageSize: 10 },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [10, 25, 50, 100],
                showInfo: true
            },
            searchPanel: {
                visible: true,
                width: 240,
                placeholder: 'Search...'
            },
            headerFilter: { visible: true },
            filterRow: { visible: false },
            filterPanel: { visible: true },
            noDataText: 'No items to display. Please select Category and Material Type.',
            columns: [
                { dataField: 'code', caption: 'Item Code', },
                {
                    dataField: null, caption: 'Details',
                    columns: [
                        { dataField: 'description', caption: 'Description' },
                        { dataField: 'unit', caption: 'Unit' },
                        { dataField: 'conversionRate', caption: 'Conversion Rate' },
                        {
                            dataField: 'unitPrice',
                            caption: 'Unit Price',
                            format: {
                                type: 'fixedPoint',
                                precision: 4
                            },
                        },
                        { dataField: 'currency', caption: 'Currency' },
                        { dataField: 'moq', caption: 'MOQ' },
                        { dataField: 'lotSize', caption: 'Lot Size' },
                        { dataField: 'leadTime', caption: 'Lead Time (Days)' },
                        { dataField: 'quotationEffectiveDate', caption: 'Quotation Effective', dataType: 'date', format: 'dd/MM/yyyy' },
                        { dataField: 'quotationExpiryDate', caption: 'Quotation Expiry', dataType: 'date', format: 'dd/MM/yyyy' },
                        {
                            dataField: 'groupOfGoods',
                            caption: 'Group of Goods',
                            lookup: {
                                dataSource: this.lookupData.groupOfGoods,
                                valueExpr: 'id',
                                displayExpr: 'displayName'
                            }
                        }
                    ]
                },
                { dataField: 'runningNumber', caption: 'Running Number', visible: false },
                { dataField: 'dataMaterial.code', caption: 'Material Code', visible: false },
                { dataFiled: 'dataMaterial.categoryId', caption: 'Material Category Id', visible: false },
                { dataFiled: 'dataMaterial.materialTypeId', caption: 'Material Material Type Id', visible: false },
                { dataField: 'dataMaterial.description', caption: 'Material Description', visible: false },
                { dataField: 'dataMaterial.unit', caption: 'Material Unit', visible: false },
                { dataField: 'dataMaterial.costCenter', caption: 'Cost Center', visible: false },
                { dataField: 'dataMaterial.unitPrice', caption: 'Material Unit Price', visible: false },
                { dataField: 'dataMaterial.minimumOrder', caption: 'Material Minimum Order', visible: false },
                { dataField: 'dataMaterial.stockControl', caption: 'Material Stock Control', visible: false },
                { dataField: 'dataMaterial.runningNumber', caption: 'Material Running Number', visible: false }
            ]
        };

        this.gridInstance = $('#editItemsGrid').dxDataGrid(gridConfig).dxDataGrid('instance');
    }

    _renderButtons() {
        this.container.querySelector('#addBtn').addEventListener('click', () => {
            const selectedItems = this.gridInstance.getSelectedRowsData();
            if (selectedItems && selectedItems.length > 0) {
                const preparedItems = this.prepareDataForSubmission(selectedItems);
                this.appForm.appMain.onSubmitEditItems(preparedItems);

                const currentEditGridData = this.gridInstance.option('dataSource') || [];
                const selectedCodes = selectedItems.map(item => item.code);

                const remainingData = currentEditGridData.filter(item =>
                    !selectedCodes.includes(item.code)
                );
                this.updateGridData(remainingData);

                this.saveToSession();

                // Clear selections
                this.gridInstance.clearSelection();
                this.gridInstance.refresh();

                // Notify user
                this.appForm.appMain.notification.success(
                    `Successfully added ${selectedItems.length} item(s)`
                );
            } else {
                this.appForm.appMain.notification.warning('Please select at least one item to add.');
            }
        });

        this.container.querySelector('#resetBtn').addEventListener('click', () => {
            this.appForm.appMain.dialog.confirm({
                title: 'Confirm Reset',
                message: 'Are you sure you want to reset the form? All unsaved changes will be lost.',
                okText: 'Yes, Reset',
                cancelText: 'Cancel',
            }).then((confirmed) => {
                if (confirmed) {
                    this.reset();
                    this.clearSession();
                }
            });
        });
    }

    prepareDataForSubmission(selectedItems) {
        console.log('Preparing items for submission:', selectedItems);
        const preparedItems = selectedItems.map(item => {
            return {
                categoryId: item.dataMaterial.categoryId,
                materialTypeId: item.dataMaterial.materialTypeId,
                materialDescription: item.dataMaterial.description,
                materialUnit: item.dataMaterial.unit,
                materialUnitPrice: item.dataMaterial.unitPrice,
                minimumOrder: item.dataMaterial.minimumOrder,
                costCenter: item.dataMaterial.costCenter,
                materialRunningNumber: item.dataMaterial.runningNumber,
                materialCode: item.dataMaterial.code,
                item: {
                    itemDescription: item.description,
                    itemUnit: item.unit,
                    itemUnitPrice: item.unitPrice,
                    moq: item.moq,
                    lotSize: item.lotSize,
                    currency: item.currency,
                    conversionRate: item.conversionRate,
                    quotationEffectiveDate: item.quotationEffectiveDate,
                    quotationExpiryDate: item.quotationExpiryDate,
                    groupOfGoods: item.groupOfGoods,
                    leadTime: item.leadTime,
                    itemRunningNumber: item.runningNumber,
                    itemCode: item.code
                }
            };
        });
        console.log('After preparation, items to submit:', preparedItems);
        return preparedItems;
    }

    saveToSession() {
        if (this.formInstance) {
            const formData = this.get();
            const lastSelectedValues = {
                categoryId: formData.categoryId,
                materialTypeId: formData.materialTypeId
            };
            sessionStorage.setItem(this.sessionKey, JSON.stringify(lastSelectedValues));
        }
    }

    async loadFromSession() {
        if (this._isLoadingFromSession || this._isChangingSupplier) {
            console.log('Already loading or changing supplier, skipping session load');
            return;
        }

        this._isLoadingFromSession = true;

        try {
            const headerData = this.appForm.appMain.header.get();
            if (!headerData.supplierCode) return;

            this.currentSupplier = { code: headerData.supplierCode };

            const saved = sessionStorage.getItem(this.sessionKey);
            if (!saved) return;

            const lastSelectedValues = JSON.parse(saved);
            if (!this.formInstance || !lastSelectedValues.categoryId) return;

            console.log('Loading from session:', lastSelectedValues);

            await this._loadCategories(this.currentSupplier.code);
            await this._setFieldValueAndWait('categoryId', lastSelectedValues.categoryId);
            await this._loadMaterialTypes(lastSelectedValues.categoryId);
            await this._setFieldValueAndWait('materialTypeId', lastSelectedValues.materialTypeId);

            console.log('Session loaded successfully');
        } catch (error) {
            console.error('Failed to load from session:', error);
        } finally {
            this._isLoadingFromSession = false;
        }
    }

    async _setFieldValueAndWait(field, value) {
        return new Promise((resolve) => {
            const editor = this.formInstance.getEditor(field);
            if (!editor) {
                console.warn(`Editor ${field} not found`);
                resolve();
                return;
            }

            const handler = (e) => {
                if (e.value === value) {
                    editor.off('valueChanged', handler);
                    requestAnimationFrame(() => {
                        setTimeout(resolve, 100);
                    });
                }
            };

            editor.on('valueChanged', handler);

            this.update(field, value);

            setTimeout(() => {
                editor.off('valueChanged', handler);
                resolve();
            }, 2000);
        });
    }

    update(field, value) {
        if (this.formInstance) {
            this.formInstance.updateData(field, value);
        }
    }

    updateGridData(data) {
        if (this.gridInstance) {
            this.gridInstance.option('dataSource', data);
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
        if (this.formInstance && this.gridInstance) {
            this.formInstance.reset();
            this.gridInstance.option('dataSource', []);

            setTimeout(() => {
                this.loadFromSession();
            }, 100);
        }
    }

    refreshGrid() {
        if (this.gridInstance) {
            this.gridInstance.refresh();
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