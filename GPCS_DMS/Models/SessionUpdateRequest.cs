namespace GPCS_DMS.Models
{
    public class SessionUpdateRequest
    {
        public string ApplicationType { get; set; } = string.Empty;
        public int? ApplicationId { get; set; }
    }
}