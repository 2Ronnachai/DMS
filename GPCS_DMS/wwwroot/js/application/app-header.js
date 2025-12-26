class AppHeader{
    constructor(appMain){
        this.appMain = appMain;
        this.container = document.getElementById('headerSection');
        this.data = null;
    }

    setData(headerData){
        console.log('Setting header data:', headerData);
        this.data = headerData;
        this.render();
    }

    render(){
        if(!this.container || !this.data) return;

        const urgentBadge = this.data.isUrgent ? `<span class="badge bg-danger ms-2">Urgent</span>` : '';

        const statusBadge = this.getStatusBadge(this.data.status);

        this.container.innerHTML = `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        ${this.data.documentType} ${urgentBadge}
                    </h6>
                    ${statusBadge}
                </div>
                <div class="card-body p-0">
                    <table class="table table-sm mb-0">
                        <tbody>
                            <tr>
                                <th style="width: 150px;">Document Number</th>
                                <td>${this.data.documentNumber}</td>
                                <th style="width: 150px;">Date</th>
                                <td>${this.formatDate(this.data.documentDate)}</td>
                            </tr>
                            <tr>
                                <th>Requestor</th>
                                <td>${this.data.requestor || '-'}</td>
                                <th>Department</th>
                                <td>${this.data.department || '-'}</td>
                            </tr>
                            <tr>
                                <th>Create Date</th>
                                <td colspan="3">${this.formatDateTime(this.data.createdDate)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getStatusBadge(status) {
        const badges = {
            'Draft': '<span class="badge bg-secondary">Draft</span>',
            'Pending Approval': '<span class="badge bg-warning text-dark">Pending Approval</span>',
            'Approved': '<span class="badge bg-success">Approved</span>',
            'Rejected': '<span class="badge bg-danger">Rejected</span>',
            'Cancelled': '<span class="badge bg-dark">Cancelled</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">-</span>';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH');
    }

    formatDateTime(dateTimeString) {
        if (!dateTimeString) return '-';
        const date = new Date(dateTimeString);
        return date.toLocaleString('th-TH');
    }

    clear() {
        this.data = null;
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

}