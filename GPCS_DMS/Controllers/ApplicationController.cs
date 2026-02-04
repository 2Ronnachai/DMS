using GPCS_DMS.Models;
using Microsoft.AspNetCore.Mvc;

namespace GPCS_DMS.Controllers
{
    public class ApplicationController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public IActionResult UpdateSession([FromBody] SessionUpdateRequest request)
        {
            if (string.IsNullOrEmpty(request.ApplicationType))
            {
                return BadRequest(new { success = false, message = "Application type is required" });
            }

            HttpContext.Session.SetString("ApplicationType", request.ApplicationType);
            
            if (request.ApplicationId.HasValue)
            {
                HttpContext.Session.SetInt32("ApplicationId", request.ApplicationId.Value);
            }
            else
            {
                HttpContext.Session.Remove("ApplicationId");
            }

            return Json(new { success = true });
        }

        [HttpGet]
        public IActionResult SetApplicationType(string applicationType, int? id)
        {
            HttpContext.Session.SetString("ApplicationType", applicationType);
            if (id.HasValue)
            {
                HttpContext.Session.SetInt32("ApplicationId", id.Value);
            }
            else
            {
                HttpContext.Session.Remove("ApplicationId");
            }

            return RedirectToAction("Requisition");
        }

        public IActionResult Requisition()
        {
            var applicationType = HttpContext.Session.GetString("ApplicationType");
            var applicationId = HttpContext.Session.GetInt32("ApplicationId");

            if(string.IsNullOrEmpty(applicationType))
            {
                return BadRequest("Application type is not set.");
            }

            ViewBag.ApplicationType = applicationType;
            ViewBag.ApplicationId = applicationId;

            return View();
        }
    }
}
