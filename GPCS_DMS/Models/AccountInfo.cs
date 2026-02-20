namespace GPCS_DMS.Models
{
    public class AccountInfo
    {
        public string NId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}";
        public string Email { get; set; } = string.Empty;
        public UserType UserType { get; set; }
        public bool IsActive { get; set; }
    }
}