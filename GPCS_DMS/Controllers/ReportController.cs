using Microsoft.AspNetCore.Mvc;
namespace GPCS_DMS.Controllers
{
    public class ReportController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Application()
        {
            return View();
        }

        public IActionResult ApplicationHistory()
        {
            return View();
        }

        public IActionResult FileAttachment()
        {
            return View();
        }

        public IActionResult StockControl()
        {
            return View();
        }
    }
}