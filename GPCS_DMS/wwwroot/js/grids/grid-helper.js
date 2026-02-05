class GridHelper {
    static createColumn(dataField, caption, options = {}) {
        return { dataField, caption, ...options };
    }

    static createLookupColumn(dataField, caption, lookupDataSource, displayExpr, valueExpr, options = {}) {
        return {
            dataField,
            caption,
            lookup: {
                dataSource: lookupDataSource,
                displayExpr: displayExpr,
                valueExpr: valueExpr
            },
            ...options
        };
    }

    static createDateColumn(dataField, caption, format = 'dd/MM/yyyy', options = {}) {
        return {
            dataField,
            caption,
            dataType: 'date',
            format: format,
            ...options
        };
    }

    static createNumberColumn(dataField, caption, format = '#,##0.##', options = {}) {
        return {
            dataField,
            caption,
            dataType: 'number',
            format: format,
            ...options
        };
    }

    static createBooleanColumn(dataField, caption, options = {}) {
        return {
            dataField,
            caption,
            dataType: 'boolean',
            ...options
        };
    }
}

window.GridHelper = GridHelper;