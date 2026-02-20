using GPCS_DMS.Interfaces;
using GPCS_DMS.Models;

namespace GPCS_DMS.Services
{
    public class AccountInfoService(HttpClient client, ILogger<AccountInfoService> logger) : IAccountInfoService
    {
        private readonly HttpClient _client = client;
        private readonly ILogger<AccountInfoService> _logger = logger;

        public async Task<AccountInfo?> GetAccountInfoAsync(string nId)
        {
            try
            {
                _logger.LogInformation("Requesting account info for NId: {NId}", nId);
                using var response = await _client.GetAsync($"accounts/by-nid/{nId}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("API returned {StatusCode} for NId: {NId}", response.StatusCode, nId);
                    return null;
                }

                var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<AccountInfo>>();
                if (apiResponse == null)
                {
                    _logger.LogWarning("Cannot deserialize ApiResponse for NId: {NId}", nId);
                    return null;
                }

                if (!apiResponse.Success || apiResponse.Data == null)
                {
                    _logger.LogWarning("Account not found or API reported failure for NId: {NId}", nId);
                    return null;
                }

                return apiResponse.Data;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching account info for NId: {NId}", nId);
                return null;
            }
        }
    }
}