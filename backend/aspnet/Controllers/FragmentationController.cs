using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;

namespace aspnet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FragmentationController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public FragmentationController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost("fragment")]
        public async Task<IActionResult> Fragment(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            var inputFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var imagesFolder = Path.Combine(_env.WebRootPath, "Images"); 
            Directory.CreateDirectory(imagesFolder); 

            var inputPath = Path.Combine(imagesFolder, inputFileName);
            using (var stream = new FileStream(inputPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var pythonUrl = "http://localhost:5000/fragment";
            byte[] fragmentedImageBytes;

            using (var httpClient = new HttpClient())
            {
                using var form = new MultipartFormDataContent();
                using var fileContent = new StreamContent(System.IO.File.OpenRead(inputPath));
                fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");

                form.Add(fileContent, "file", inputFileName);

                var response = await httpClient.PostAsync(pythonUrl, form);

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, 
                        "Error calling Python fragmentation service.");
                }

                fragmentedImageBytes = await response.Content.ReadAsByteArrayAsync();
            }

            var outputFileName = $"fragmented_{inputFileName}.png";
            var outputPath = Path.Combine(imagesFolder, outputFileName);
            await System.IO.File.WriteAllBytesAsync(outputPath, fragmentedImageBytes);

            var relativePath = $"/Images/{outputFileName}";
            return Ok(new 
            { 
                message = "Fragmentation successful",
                segmentedImagePath = relativePath
            });

            // Option B: Return the raw file directly
            // return PhysicalFile(outputPath, "image/png");
        }
    }
}
