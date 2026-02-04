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

        // ===== API Methods สำหรับ GPCS Material =====

        [HttpGet]
        public IActionResult GetMaterials(int skip = 0, int take = 20, string? filter = null, string? sort = null)
        {
            try
            {
                // TODO: ดึงข้อมูลจาก Database
                // นี่คือตัวอย่าง - ต้องแก้ให้ดึงจาก DB จริง
                
                var allMaterials = new List<object>
                {
                    new { 
                        materialId = 1, 
                        materialCode = "MAT001", 
                        materialName = "Steel Rod 10mm",
                        category = "Steel",
                        description = "Steel rod diameter 10mm",
                        unitPrice = 150.00,
                        unit = "kg",
                        createdDate = DateTime.Now.AddDays(-30),
                        isActive = true 
                    },
                    new { 
                        materialId = 2, 
                        materialCode = "MAT002", 
                        materialName = "Aluminum Sheet 2mm",
                        category = "Aluminum",
                        description = "Aluminum sheet thickness 2mm",
                        unitPrice = 250.00,
                        unit = "sheet",
                        createdDate = DateTime.Now.AddDays(-25),
                        isActive = true 
                    },
                    new { 
                        materialId = 3, 
                        materialCode = "MAT003", 
                        materialName = "Copper Wire 5mm",
                        category = "Copper",
                        description = "Copper wire diameter 5mm",
                        unitPrice = 180.00,
                        unit = "m",
                        createdDate = DateTime.Now.AddDays(-20),
                        isActive = false 
                    },
                    new { 
                        materialId = 4, 
                        materialCode = "MAT004", 
                        materialName = "Steel Plate 5mm",
                        category = "Steel",
                        description = "Steel plate thickness 5mm",
                        unitPrice = 200.00,
                        unit = "sheet",
                        createdDate = DateTime.Now.AddDays(-15),
                        isActive = true 
                    },
                    new { 
                        materialId = 5, 
                        materialCode = "MAT005", 
                        materialName = "Aluminum Tube 20mm",
                        category = "Aluminum",
                        description = "Aluminum tube diameter 20mm",
                        unitPrice = 120.00,
                        unit = "m",
                        createdDate = DateTime.Now.AddDays(-10),
                        isActive = true 
                    },
                    new { 
                        materialId = 6, 
                        materialCode = "MAT006", 
                        materialName = "Copper Plate 3mm",
                        category = "Copper",
                        description = "Copper plate thickness 3mm",
                        unitPrice = 280.00,
                        unit = "sheet",
                        createdDate = DateTime.Now.AddDays(-8),
                        isActive = true 
                    },
                    new { 
                        materialId = 7, 
                        materialCode = "MAT007", 
                        materialName = "Steel Beam H200",
                        category = "Steel",
                        description = "H-Beam steel 200mm",
                        unitPrice = 450.00,
                        unit = "m",
                        createdDate = DateTime.Now.AddDays(-6),
                        isActive = true 
                    },
                    new { 
                        materialId = 8, 
                        materialCode = "MAT008", 
                        materialName = "Aluminum Bar 30mm",
                        category = "Aluminum",
                        description = "Aluminum bar diameter 30mm",
                        unitPrice = 190.00,
                        unit = "m",
                        createdDate = DateTime.Now.AddDays(-4),
                        isActive = false 
                    },
                    new { 
                        materialId = 9, 
                        materialCode = "MAT009", 
                        materialName = "Copper Tube 15mm",
                        category = "Copper",
                        description = "Copper tube diameter 15mm",
                        unitPrice = 220.00,
                        unit = "m",
                        createdDate = DateTime.Now.AddDays(-2),
                        isActive = true 
                    },
                    new { 
                        materialId = 10, 
                        materialCode = "MAT010", 
                        materialName = "Steel Angle 50x50mm",
                        category = "Steel",
                        description = "Steel angle 50x50mm",
                        unitPrice = 95.00,
                        unit = "m",
                        createdDate = DateTime.Now.AddDays(-1),
                        isActive = true 
                    }
                };

                var total = allMaterials.Count;
                var data = allMaterials.Skip(skip).Take(take).ToList();

                return Json(new { data, totalCount = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult InsertMaterial([FromBody] dynamic material)
        {
            try
            {
                // TODO: Insert ลง Database
                return Json(new { success = true, message = "Material inserted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut]
        public IActionResult UpdateMaterial(int id, [FromBody] dynamic material)
        {
            try
            {
                // TODO: Update ใน Database
                return Json(new { success = true, message = "Material updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete]
        public IActionResult DeleteMaterial(int id)
        {
            try
            {
                // TODO: Delete จาก Database
                return Json(new { success = true, message = "Material deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}