using Microsoft.AspNetCore.Mvc;

namespace GPCS_DMS.Controllers
{
    public class DataController : Controller
    {
        public IActionResult GPCSMaterial()
        {
            return View();
        }

        public IActionResult GPCSItem()
        {
            return View();
        }

        public IActionResult GPCSInventory()
        {
            return View();
        }

        public IActionResult Material()
        {
            return View();
        }

        public IActionResult Item()
        {
            return View();
        }

        public IActionResult Supplier()
        {
            return View();
        }
    }
}