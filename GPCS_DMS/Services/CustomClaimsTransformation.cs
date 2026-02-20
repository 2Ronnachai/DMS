using GPCS_DMS.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;

namespace GPCS_DMS.Services
{
    public class CustomClaimsTransformation(
        IAccountInfoService accountInfoService, 
        IMemoryCache cache,
        ILogger<CustomClaimsTransformation> logger) : IClaimsTransformation
    {
        private readonly IAccountInfoService _accountInfoService = accountInfoService;
        private readonly IMemoryCache _cache = cache;
        private readonly ILogger<CustomClaimsTransformation> _logger = logger;
        public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var identity = principal.Identity as ClaimsIdentity;
            if (identity == null || !identity.IsAuthenticated)
                return principal;

            var userName = identity.Name?.Split('\\').LastOrDefault();
            if (string.IsNullOrEmpty(userName))
                return principal;

            if (!_cache.TryGetValue(userName, out var cachedClaimsObj) || cachedClaimsObj is not List<Claim> extraClaims)
            {
                try
                {
                    var info = await _accountInfoService.GetAccountInfoAsync(userName);
                    if (info != null)
                    {
                        extraClaims =
                        [
                            new("NId", info.NId ?? string.Empty),
                            new("UserType", info.UserType.ToString() ?? string.Empty),
                            new("FullName", info.FullName ?? string.Empty),
                            new("Email", info.Email ?? string.Empty)
                        ];

                        _cache.Set(userName, extraClaims, TimeSpan.FromMinutes(30));
                        _logger.LogInformation("Cached claims for user {UserName}", userName);
                    }
                    else
                    {
                        _logger.LogWarning("Could not fetch account info for user {UserName}", userName);
                        extraClaims = [];
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error transforming claims for {UserName}", userName);
                    extraClaims = [];
                }
            }

            foreach (var claim in extraClaims)
            {
                if (!identity.HasClaim(c => c.Type == claim.Type))
                    identity.AddClaim(claim);
            }

            return principal;
        }
    }
}
