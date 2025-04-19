using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;

namespace aspnet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OcrController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly MyAppEnv _envSettings;

        public OcrController(IWebHostEnvironment env,IOptions<MyAppEnv> envSettings)
        {
            _env = env;
            _envSettings = envSettings.Value;
        }

        [HttpPost]
        public async Task<IActionResult> Analyze(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }
            var imagesFolder = Path.Combine(_env.WebRootPath, "Images");
            Directory.CreateDirectory(imagesFolder); 

            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var inputPath = Path.Combine(imagesFolder, uniqueFileName);
            using (var stream = new FileStream(inputPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            var pythonApi = _envSettings.PythonBaseUrl;
            var pythonUrl = $"{pythonApi}/ocr";
            string ocrResultJson;

            using (var httpClient = new HttpClient())
            {
                using var form = new MultipartFormDataContent();
                using var fileContent = new StreamContent(System.IO.File.OpenRead(inputPath));
                fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");

                form.Add(fileContent, "file", uniqueFileName);

                var response = await httpClient.PostAsync(pythonUrl, form);
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, "Error calling Python OCR service.");
                }

                ocrResultJson = await response.Content.ReadAsStringAsync();
            }

            System.IO.File.Delete(inputPath);
            return Content(ocrResultJson, "application/json");
        }
    }
}
