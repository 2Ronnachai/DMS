using GPCS_DMS.Models;

namespace GPCS_DMS.Interfaces
{
    public interface IAccountInfoService
    {
        Task<AccountInfo?> GetAccountInfoAsync(string nId);
    }
}