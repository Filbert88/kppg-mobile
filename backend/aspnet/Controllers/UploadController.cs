using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Threading.Tasks;

namespace aspnet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        // POST: api/Upload/upload
        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var imagesFolder = Path.Combine(_env.WebRootPath, "Images");
            Directory.CreateDirectory(imagesFolder);
            var filePath = Path.Combine(imagesFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = $"{Request.Scheme}://{Request.Host}/Images/{fileName}";
            return Ok(new { url = fileUrl });
        }

        [HttpPost("upload-video")]
        public async Task<IActionResult> UploadVideo([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowed = new[] { ".mp4", ".mov", ".avi", ".mkv", ".webm" };

            if (!allowed.Contains(ext))
                return BadRequest("Invalid video format.");

            var folder = Path.Combine("wwwroot", "Videos");
            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            var uniqueFileName = $"{Guid.NewGuid()}{ext}";
            var path = Path.Combine(folder, uniqueFileName);

            using (var stream = new FileStream(path, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var publicUrl = $"{Request.Scheme}://{Request.Host}/Videos/{uniqueFileName}";
            return Ok(new { url = publicUrl });
        }
    }
}
