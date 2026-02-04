/**
 * GridCustomStore - DevExpress CustomStore with API integration
 */
class GridCustomStore {
    constructor(options = {}) {
        this.options = options;
        this.dialog = appDialog;
        this.loading = appLoading;
        this.notification = appNotification;
    }
    static create(options = {}) {
        const {
            apiUrl,
            key = 'id',
            insertUrl,
            updateUrl,
            deleteUrl,
            onBeforeLoad,
            onAfterLoad,
            onError
        } = options;

        return new DevExpress.data.CustomStore({
            key: key,
            
            load: async function(loadOptions) {
                // Callback before load
                if (onBeforeLoad) {
                    onBeforeLoad(loadOptions);
                }

                // Build parameters
                const params = GridCustomStore._buildLoadParams(loadOptions);

                // Call API
                try {
                    const response = await $.ajax({
                        url: apiUrl,
                        method: 'GET',
                        data: params,
                        dataType: 'json'
                    });

                    // Callback after load
                    if (onAfterLoad) {
                        onAfterLoad(response);
                    }

                    const totalCount = response.totalCount || response.total || (response.data ? response.data.length : 0);
                    window.gridTotalCount = totalCount;

                    setTimeout(() => {
                        const $label = $('.total-count-label');
                        if ($label.length > 0) {
                            $label.html(`<i class="fa fa-list"></i> Total: <strong>${totalCount.toLocaleString()}</strong> record${totalCount !== 1 ? 's' : ''}`);
                        }
                    }, 50);
                    return {
                        data: response.data || response,
                        totalCount: totalCount
                    };
                } catch (error) {
                    // Show error
                    if (this.notification) {
                        this.notification.show('Failed to load data', 'error');
                    }

                    // Callback error
                    if (onError) {
                        onError(error);
                    }

                    console.error('Load error:', error);
                    throw error;
                }
            },

            insert: async function(values) {
                if (!insertUrl) {
                    throw new Error('Insert URL not configured');
                }
                try {
                    const response = await $.ajax({
                        url: insertUrl,
                        method: 'POST',
                        data: JSON.stringify(values),
                        contentType: 'application/json',
                        dataType: 'json'
                    });

                    if (this.notification) {
                        this.notification.show('Record inserted successfully', 'success');
                    }
                    return response;
                } catch (error) {
                    if (this.notification) {
                        this.notification.show('Failed to insert record', 'error');
                    }
                    if (onError) {
                        onError(error);
                    }
                    throw error;
                }
            },

            update: async function(key, values) {
                if (!updateUrl) {
                    throw new Error('Update URL not configured');
                }

                const url = updateUrl.replace('{id}', key);

                try {
                    const response = await $.ajax({
                        url: url,
                        method: 'PUT',
                        data: JSON.stringify(values),
                        contentType: 'application/json',
                        dataType: 'json'
                    });
 
                    if (this.notification) {
                        this.notification.show('Record updated successfully', 'success');
                    }
                    return response;
                } catch (error) {
                    if (this.notification) {
                        this.notification.show('Failed to update record', 'error');
                    }
                    if (onError) {
                        onError(error);
                    }
                    throw error;
                }
            },

            remove: async function(key) {
                if (!deleteUrl) {
                    throw new Error('Delete URL not configured');
                }

                const url = deleteUrl.replace('{id}', key);

                return await $.ajax({
                    url: url,
                    method: 'DELETE',
                    dataType: 'json'
                })
                .then(response => {
                    if (this.notification) {
                        this.notification.show('Record deleted successfully', 'success');
                    }
                    return response;
                })
                .catch(error => {
                    if (this.notification) {
                        this.notification.show('Failed to delete record', 'error');
                    }
                    if (onError) {
                        onError(error);
                    }
                    throw error;
                });
            }
        });
    }

    static _buildLoadParams(loadOptions) {
        const params = {
            skip: loadOptions.skip || 0,
            take: loadOptions.take || 20,
            requireTotalCount: loadOptions.requireTotalCount || false
        };

        // Filter
        if (loadOptions.filter) {
            params.filter = JSON.stringify(loadOptions.filter);
        }

        // Sort
        if (loadOptions.sort) {
            params.sort = JSON.stringify(loadOptions.sort);
        }

        // Group
        if (loadOptions.group) {
            params.group = JSON.stringify(loadOptions.group);
        }

        // Search
        if (loadOptions.searchValue) {
            params.searchValue = loadOptions.searchValue;
        }

        return params;
    }
}

// Make it available globally
window.GridCustomStore = GridCustomStore;
