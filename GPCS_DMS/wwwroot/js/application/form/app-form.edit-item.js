class EditItemForm {
    constructor(appForm, container, applicationData = null) {
        this.appForm = appForm;
        this.container = container;
        this.data = applicationData;

        this.formInstance = null;
        this.gridInstance = null;

        this.currentSupplier = null;
        this.sessionKey = `${this.appForm.appMain.applicationType.toLowerCase()}_lastSelected`;

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
            this._renderGrid();

            setTimeout(() => {
                this.loadFromSession();
            }, 100);
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
        console.log('EditItemForm detected supplier change:', supplier);
        if(supplier && supplier.code){
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
        }else{
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
    }

    async _loadCategories(supplierCode) {
        try {
            // const categories = await this.appForm.appMain.formComponents.getCategoriesDataSource();
            // this.lookupData.categories = categories || [];

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
        }
    }

     async _loadMaterialTypes(categoryId) {
        try {
            const materialTypes = await this.appForm.appMain.formComponents.getMaterialTypesDataSource(categoryId);
            
            const materialTypeEditor = this.formInstance.getEditor('materialTypeId');
            if (materialTypeEditor) {
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
        }
    }

    async _loadItems() {
        const formData = this.get();
        const headerData = this.appForm.appMain.header.get();

        if (!headerData.supplierCode || !formData.categoryId || !formData.materialTypeId) {
            return;
        }

        try {
            const items = await this._getDataItemList();
            if (this.gridInstance) {
                this.gridInstance.option('dataSource', items);
            }
        } catch (error) {
            console.error('Error loading items:', error);
            this.appForm.appMain.notification.error('Failed to load items');
        }
    }

    _getDataItemList(){
        const formData = this.get();
        const supplierCode = this.currentSupplier ? this.currentSupplier.code : null;

        const payload = {
            supplierCode: supplierCode,
            categoryId: formData.categoryId,
            materialTypeId: formData.materialTypeId
        };

        return this.appForm.appMain.http.post('items/by-supplier-category-materialtype', payload)
            .then(response => {
                if (response.success) {
                    return response.data || [];
                } else {
                    throw new Error(response.message || 'Failed to fetch items');
                }
            });
    }

    _renderGrid() {
        const gridContainer = document.createElement('div');
        gridContainer.className = 'edit-items-grid mt-4';
        gridContainer.innerHTML = `
            <div id="editItemsGrid"></div>
        `;
        this.container.appendChild(gridContainer);
        this._renderEditItemsGrid();
    }

    prepareDataForSubmission() {

    }

    update(field, value) {
        if (this.formInstance) {
            this.formInstance.update(field, value);
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