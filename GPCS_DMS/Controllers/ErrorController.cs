using System.Diagnostics;
using GPCS_DMS.Models;
using Microsoft.AspNetCore.Mvc;

namespace GPCS_DMS.Controllers
{
    public class ErrorController : Controller
    {
        private readonly ILogger<ErrorController> _logger;

        public ErrorController(ILogger<ErrorController> logger)
        {
            _logger = logger;
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        [Route("Error")]
        public IActionResult Error()
        {
            var model = new ErrorPageViewModel
            {
                StatusCode = 500,
                Message = "An unexpected error occurred.",
                RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier,
                Path = HttpContext.Request.Path
            };
            return View("Error", model);
        }

        [Route("Error/{statusCode}")]
        public IActionResult HandleErrorCode(int statusCode)
        {
            var path = HttpContext.Request.Path.ToString();

            var message = statusCode switch
            {
                404 => "Sorry, the page you requested could not be found.",
                403 => "You don't have permission to access this page.",
                _ => "An unexpected error occurred."
            };

            var model = new ErrorPageViewModel
            {
                StatusCode = statusCode,
                Message = message,
                RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier,
                Path = path
            };

            return View("Error", model);
        }
    }
}