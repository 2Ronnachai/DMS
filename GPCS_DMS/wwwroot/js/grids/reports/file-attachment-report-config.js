const FileAttachmentReportGridConfig = {
    gridId: 'fileAttachmentReportGrid',
    container: '#gridFileAttachmentReport',
    endpoint: `${window.APP_CONFIG.baseUrl}dxGridFileAttachments`,
    keyField: 'id',
    exportFileName: 'File_Attachment_Report',
    columns: [
        // public int ApplicationId { get; set; }
        // public string FileName { get; set; } = string.Empty;
        // public string ContentType { get; set; } = string.Empty;
        // public long Length { get; set; }
        // public string FileSizeDisplay { get; set; } = string.Empty;
        GridHelper.createNumberColumn('id', 'ID', '#,##0', {
            width: 80,
            allowEditing: false,
            fixed: true,
            visible: false,
            formItem: { visible: false },
        }),

        GridHelper.createNumberColumn('applicationId', 'Application ID', '#,##0', {
            width: 150,
            allowEditing: false,
            fixed: false,
            visible: false,
        }),

        GridHelper.createColumn('applicationNumber', 'Application Number', {
            minWidth: 180,
            allowEditing: false,
            fixed: true,
        }),

        GridHelper.createColumn('fileName', 'File Name', {
            minWidth: 250,
            allowEditing: false,
            fixed: false,
        }),

        GridHelper.createColumn('contentType', 'Content Type', {
            width: 200,
            allowEditing: false,
            fixed: false,
            cellTemplate: function (container, options) {

                $('<div>')
                    .css({
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    })
                    .attr('title', options.value)
                    .text(options.value)
                    .appendTo(container);
            }
        }),

        GridHelper.createNumberColumn('length', 'Length (bytes)', '#,##0', {
            width: 150,
            allowEditing: false,
            fixed: false,
            visible: false,
        }),

        GridHelper.createColumn('fileSizeDisplay', 'File Size', {
            width: 120,
            allowEditing: false,
            fixed: false,
            allowSorting: false,
            allowFiltering: false,
            allowSearch: false
        }),
        {
            type: 'buttons',
            buttons: [
                {
                    hint: 'Preview',
                    icon: 'search',
                    visible: function (e) {
                        const type = e.row.data.contentType;
                        return type.includes('pdf') || type.startsWith('image/');
                    },
                    onClick: function (e) {

                        e.event.stopPropagation();

                        const id = e.row.data.id;

                        const url = `${window.APP_CONFIG.baseUrl}file-attachments/${id}/preview`;
                        window.open(url, '_blank');
                    }
                },
                {
                    hint: 'Download File',
                    icon: 'download',
                    onClick: async function (e) {
                        e.event.stopPropagation();
                        const id = e.row.data.id;
                        // Get Method to download file
                        const response = await Http.getBlob(`${window.APP_CONFIG.baseUrl}file-attachments/${id}/download`);
                        const url = URL.createObjectURL(response.blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = response.fileName;
                        link.target = '_self';

                        link.click();
                        URL.revokeObjectURL(url);
                    },
                }
            ],
        },
        ...GridFactory.getAuditColumns()
    ]
}