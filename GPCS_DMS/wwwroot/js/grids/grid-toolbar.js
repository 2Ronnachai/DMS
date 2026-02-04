class GridToolbarManager {
    constructor(gridInstance, options = {}) {
        this.gridInstance = gridInstance;
        this.options = options;
    }

    prepareToolbar(e, callbacks = {}) {
        const toolbarItems = e.toolbarOptions.items;

        // Total Count display
        toolbarItems.unshift({
            location: 'before',
            template: (data, index, element) => {
                const $container = $('<div class="dx-toolbar-label" style="margin-right: 20px;display: flex; align-items: center;"></div>');
                const $label = $('<span class="total-count-label" style="font-weight: 400; color: #1890ff; font-size: 14px;">Loading...</span>');
                $container.append($label);
                
                setTimeout(() => {
                    this._updateTotalCount();
                }, 500);
                
                element.append($container);
            }
        });
        
        // Refresh button
        toolbarItems.push({
            location: 'after',
            widget: 'dxButton',
            options: {
                icon: 'refresh',
                hint: 'Refresh data',
                onClick: () => {
                    if (callbacks.onRefresh) callbacks.onRefresh();
                }
            }
        });

        // Clear Filters button
        if (this.options.enableFilterRow || this.options.enableHeaderFilter || this.options.enableSearchPanel) {
            toolbarItems.push({
                location: 'after',
                widget: 'dxButton',
                options: {
                    icon: 'clear',
                    hint: 'Clear all filters',
                    onClick: () => {
                        if (callbacks.onClearFilters) callbacks.onClearFilters();
                    }
                }
            });
        }

        // === RIGHT SIDE BUTTONS ===
        

        // Column Chooser button
        if (this.options.enableColumnChooser) {
            const hasColumnChooser = toolbarItems.some(item => item.name === 'columnChooserButton');
            if (!hasColumnChooser) {
                toolbarItems.push({
                    location: 'after',
                    widget: 'dxButton',
                    options: {
                        icon: 'columnchooser',
                        hint: 'Column Chooser',
                        stylingMode: 'text',
                        onClick: () => {
                            if (this.gridInstance) {
                                this.gridInstance.showColumnChooser();
                            }
                        }
                    }
                });
            }
        }

        // Reset State button (ซ่อนเมื่อ clear filters)
        if (this.options.enableStateStorage) {
            toolbarItems.push({
                location: 'after',
                widget: 'dxButton',
                options: {
                    icon: 'revert',
                    hint: 'Reset grid state (columns, filters, sorting)',
                    onClick: () => {
                        if (callbacks.onResetState) callbacks.onResetState();
                    }
                }
            });
        }
    }

    _updateTotalCount() {
        setTimeout(() => {
            const count = window.gridTotalCount || 0;
            const $label = $('.total-count-label');
            if ($label.length > 0) {
                $label.html(`<i class="fa fa-list"></i> Total: ${count.toLocaleString()} record${count !== 1 ? 's' : ''}`);
            }
        }, 100);
    }

    updateTotalCount() {
        this._updateTotalCount();
    }
}
