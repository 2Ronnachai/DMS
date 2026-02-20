namespace GPCS_DMS.Models
{
    public class ErrorPageViewModel
    {
        public int StatusCode { get; set; } = 500;
        public string Message { get; set; } = "An unexpected error occurred.";
        public string? Path { get; set; }
        public string? RequestId { get; set; }
    }
}
