using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using aspnet.Data;
using aspnet.Models;
using System.Net.Http.Headers;

namespace aspnet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FragmentationController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly ApplicationDbContext _context;
        private readonly IHttpClientFactory _clientFactory;

        public FragmentationController(IWebHostEnvironment env, ApplicationDbContext context, IHttpClientFactory clientFactory)
        {
            _env = env;
            _context = context;
            _clientFactory = clientFactory;
        }

        // GET: api/Fragmentation
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var fragmentationDatas = await _context.FragmentationDatas
                .Include(fd => fd.FragmentationImages)
                    .ThenInclude(fi => fi.FragmentationImageResults)
                .ToListAsync();
            return Ok(fragmentationDatas);
        }

        // GET: api/Fragmentation/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var fragmentationData = await _context.FragmentationDatas
                .Include(fd => fd.FragmentationImages)
                    .ThenInclude(fi => fi.FragmentationImageResults)
                .FirstOrDefaultAsync(fd => fd.Id == id);

            if (fragmentationData == null)
                return NotFound();

            return Ok(fragmentationData);
        }

        // POST: api/Fragmentation
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] FragmentationData fragmentationData)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _context.FragmentationDatas.Add(fragmentationData);
            await _context.SaveChangesAsync();

            return Ok(fragmentationData);
        }

        // PUT: api/Fragmentation/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] FragmentationData fragmentationData)
        {
            if (id != fragmentationData.Id)
                return BadRequest();

            _context.Entry(fragmentationData).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await FragmentationDataExists(id))
                    return NotFound();

                throw;
            }

            return NoContent();
        }

        // DELETE: api/Fragmentation/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var fragmentationData = await _context.FragmentationDatas.FindAsync(id);
            if (fragmentationData == null)
                return NotFound();

            _context.FragmentationDatas.Remove(fragmentationData);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> FragmentationDataExists(int id)
        {
            return await _context.FragmentationDatas.AnyAsync(e => e.Id == id);
        }

        // POST: api/Fragmentation/fragment
        // This function remains largely unchanged. It calls an external Python service to process an image.
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

            // URL of your Python fragmentation service.
            var pythonUrl = "http://localhost:5000/fragment";
            byte[] fragmentedImageBytes;

            using (var httpClient = _clientFactory.CreateClient())
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

            // Optionally, you could return the raw file directly:
            // return PhysicalFile(outputPath, "image/png");
        }
    }
}
