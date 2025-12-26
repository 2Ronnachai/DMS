using Microsoft.AspNetCore.Mvc;

namespace GPCS_DMS.Controllers
{
    public class ApplicationController : Controller
    {
        public IActionResult Index()
        {
            return View();
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

        public IActionResult Create()
        {
            return View();
        }

        public IActionResult Details(int id)
        {
            return View();
        }
    }
}
