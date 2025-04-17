using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using aspnet.Data;
using aspnet.Models;
using System.Net.Http.Headers;
using System.Text.Json;

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

        // POST: api/Fragmentation/multi-fragment
        [HttpPost("multi-fragment")]
        public async Task<IActionResult> MultiFragment(List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
                return BadRequest("No files uploaded.");

            var results = new List<object>();

            foreach (var file in files)
            {
                // Generate a unique file name and determine the full path.
                var inputFileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                var inputPath = Path.Combine(_env.WebRootPath, "Images", inputFileName);
                Directory.CreateDirectory(Path.GetDirectoryName(inputPath)!);

                // Write the file to disk using a FileStream (ensuring exclusive access)
                await using (var stream = new FileStream(inputPath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    await file.CopyToAsync(stream);
                }

                // Read the file bytes into memory and then dispose of the file handle.
                byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(inputPath);

                // Use a MemoryStream to add the file to the MultipartFormDataContent.
                using var form = new MultipartFormDataContent();
                using (var ms = new MemoryStream(fileBytes))
                {
                    using var imageContent = new StreamContent(ms);
                    imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
                    form.Add(imageContent, "file", inputFileName);

                    var client = _clientFactory.CreateClient("LongRunningClient");
                    var response = await client.PostAsync("http://localhost:5000/fragmentation-red-outline", form);

                    if (!response.IsSuccessStatusCode)
                    {
                        results.Add(new
                        {
                            filename = inputFileName,
                            error = $"Python API error: {response.StatusCode}"
                        });
                    }
                    else
                    {
                        var responseData = await response.Content.ReadAsStringAsync();
                        var parsed = System.Text.Json.JsonSerializer.Deserialize<object>(responseData); // Consider using a strong type here
                        results.Add(new
                        {
                            filename = inputFileName,
                            result = parsed
                        });
                    }
                }

                // Now that the file is no longer in use, delete it.
                System.IO.File.Delete(inputPath);
            }

            return Ok(results);
        }

        // POST: api/Fragmentation/fragmentation-analysis
        [HttpPost("fragmentation-analysis")]
        public async Task<IActionResult> RunFragmentationAnalysis(
           List<IFormFile> files,
           [FromForm] double A,
           [FromForm] double K,
           [FromForm] double Q,
           [FromForm] double E,
           [FromForm] double n,
           [FromForm] double conversion)
        {
            if (files == null || files.Count == 0)
                return BadRequest("No files uploaded.");

            var client = _clientFactory.CreateClient("LongRunningClient");
            var results = new List<object>();

            // Process each uploaded file
            foreach (var file in files)
            {
                using var content = new MultipartFormDataContent();
                using var fileStream = file.OpenReadStream();
                var fileContent = new StreamContent(fileStream);
                fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");

                content.Add(fileContent, "file", file.FileName);
                content.Add(new StringContent(A.ToString()), "A");
                content.Add(new StringContent(K.ToString()), "K");
                content.Add(new StringContent(Q.ToString()), "Q");
                content.Add(new StringContent(E.ToString()), "E");
                content.Add(new StringContent(n.ToString()), "n");
                content.Add(new StringContent(conversion.ToString()), "conversion");

                var response = await client.PostAsync("http://localhost:5000/fragmentation-analysis", content);
                if (!response.IsSuccessStatusCode)
                {
                    results.Add(new { filename = file.FileName, error = $"Analysis failed with status {response.StatusCode}" });
                    continue;
                }
                var jsonResponse = await response.Content.ReadAsStringAsync();
                var parsedResult = JsonSerializer.Deserialize<object>(jsonResponse);
                results.Add(parsedResult);
            }
            return Ok(results);
        }
    }
}
