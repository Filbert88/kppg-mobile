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
        // POST: api/Fragmentation
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] FragmentationDataDto dto)
        {
            // 1) Check for priority conflict on same day
            bool exists = await _context.FragmentationDatas
                .AnyAsync(f => f.Tanggal.Date == dto.Tanggal.Date && f.Prioritas == dto.Prioritas);

            if (exists)
            {
                var existing = await _context.FragmentationDatas
                    .Where(f => f.Tanggal.Date == dto.Tanggal.Date)
                    .Select(f => f.Prioritas)
                    .ToListAsync();

                return Conflict(new
                {
                    message = $"Priority {dto.Prioritas} on {dto.Tanggal:yyyy-MM-dd} already exists",
                    existingPriorities = existing
                });
            }

            // 2) Map DTO → EF Entity
            var entity = new FragmentationData
            {
                Skala = dto.Skala,
                Pilihan = dto.Pilihan,
                Ukuran = dto.Ukuran,
                Prioritas = dto.Prioritas,
                Lokasi = dto.Lokasi,
                Tanggal = dto.Tanggal,
                Litologi = dto.Litologi,
                AmmoniumNitrate = dto.AmmoniumNitrate,
                VolumeBlasting = dto.VolumeBlasting,
                PowderFactor = dto.PowderFactor,
            
                Synced = 1
            };

            // 3) Create FragmentationImsse and Results
            for (int i = 0; i < dto.UploadedImageUrls.Count; i++)
            {
                var image = new FragmentationImage
                {
                    ImageUri = dto.UploadedImageUrls[i],
                    Synced = 1
                };

                // Optional: Add corresponding fragmented result
                if (i < dto.FragmentedImageUrls.Count)
                {
                    image.FragmentationImageResults.Add(new FragmentationImageResult
                    {
                        Result1 = dto.FragmentedImageUrls[i], // fragmented result image URL
                        Result2 = JsonSerializer.Serialize(dto.AnalysisJson), // full analysis object
                        Synced = 1
                    });
                }

                // Optional: Add plot result only on first image
                if (i == 0 && !string.IsNullOrEmpty(dto.PlotImageUrl))
                {
                    image.FragmentationImageResults.Add(new FragmentationImageResult
                    {
                        Result1 = dto.PlotImageUrl, // the plot image
                        Result2 = JsonSerializer.Serialize(dto.AnalysisJson),
                        Synced = 1
                    });
                }

                entity.FragmentationImages.Add(image);
            }

            // 4) Save
            _context.FragmentationDatas.Add(entity);
            await _context.SaveChangesAsync();

            // 5) Return the saved record with all children included
            var saved = await _context.FragmentationDatas
                .Include(f => f.FragmentationImages)
                    .ThenInclude(i => i.FragmentationImageResults)
                .FirstOrDefaultAsync(f => f.Id == entity.Id);

            return Ok(new
            {
                id = entity.Id,
                prioritas = entity.Prioritas,
                tanggal = entity.Tanggal
            });

        }

        // [HttpPut("{id}")]
        // public async Task<IActionResult> Update(int id, [FromBody] FragmentationDataDto dto)
        // {
        //     var existing = await _context.FragmentationDatas
        //         .Include(f => f.FragmentationImages)
        //           .ThenInclude(i => i.FragmentationImageResults)
        //         .FirstOrDefaultAsync(f => f.Id == id);

        //     if (existing == null) return NotFound();
        //     if (dto.Prioritas != existing.Prioritas
        //      || dto.Tanggal.Date != existing.Tanggal.Date)
        //     {
        //         // re‑check collision if they changed date or priority
        //         bool conflict = await _context.FragmentationDatas
        //           .AnyAsync(f => f.Id != id
        //                       && f.Tanggal.Date == dto.Tanggal.Date
        //                       && f.Prioritas == dto.Prioritas);
        //         if (conflict) return Conflict("Priority conflict");
        //     }

        //     // map updated fields
        //     existing.Skala = dto.Skala;
        //     existing.Pilihan = dto.Pilihan;
        //     existing.Ukuran = dto.Ukuran;
        //     existing.Prioritas = dto.Prioritas;
        //     existing.Lokasi = dto.Lokasi;
        //     existing.Tanggal = dto.Tanggal;
        //     existing.Litologi = dto.Litologi;
        //     existing.AmmoniumNitrate = dto.AmmoniumNitrate;
        //     existing.VolumeBlasting = dto.VolumeBlasting;
        //     existing.PowderFactor = dto.PowderFactor;
        //     // if DiggingTime/VideoUri exist, update them too

        //     // for simplicity here we’ll **wipe** old images/results and re‑add:
        //     _context.FragmentationImageResults
        //         .RemoveRange(existing.FragmentationImages.SelectMany(i => i.FragmentationImageResults));
        //     _context.FragmentationImages.RemoveRange(existing.FragmentationImages);

        //     // now re‑add exactly as in Create:
        //     foreach (var url in dto.UploadedImageUrls)
        //     {
        //         var img = new FragmentationImage
        //         {
        //             ImageUri = url,
        //             Synced = 1
        //         };
        //         foreach (var frag in dto.FragmentedResults)
        //         {
        //             img.FragmentationImageResults.Add(new FragmentationImageResult
        //             {
        //                 Result1 = frag.ImageDataUrl,
        //                 Result2 = JsonSerializer.Serialize(frag.AnalysisJson),
        //                 Synced = 1
        //             });
        //         }
        //         existing.FragmentationImages.Add(img);
        //     }

        //     await _context.SaveChangesAsync();
        //     return NoContent();
        // }

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

            foreach (var file in files)
            {
                using var content = new MultipartFormDataContent();
                // stream the file
                using var stream = file.OpenReadStream();
                var fileContent = new StreamContent(stream);
                fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
                content.Add(fileContent, "file", file.FileName);

                // append your parameters
                content.Add(new StringContent(A.ToString()), "A");
                content.Add(new StringContent(K.ToString()), "K");
                content.Add(new StringContent(Q.ToString()), "Q");
                content.Add(new StringContent(E.ToString()), "E");
                content.Add(new StringContent(n.ToString()), "n");
                content.Add(new StringContent(conversion.ToString()), "conversion");

                var response = await client.PostAsync("http://localhost:5000/fragmentation-analysis", content);
                if (!response.IsSuccessStatusCode)
                {
                    results.Add(new { filename = file.FileName, error = response.StatusCode });
                    continue;
                }

                var json = await response.Content.ReadAsStringAsync();
                // you can strongly type this instead of object
                var parsed = JsonSerializer.Deserialize<object>(json);
                results.Add(parsed);
            }

            return Ok(results);
        }

        // in FragmentationController.cs
        // GET: api/Fragmentation/today?priority=1
        [HttpGet("today")]
        public async Task<IActionResult> GetTodayByPriority([FromQuery] int priority)
        {
            var today = DateTime.UtcNow.Date;
            var frag = await _context.FragmentationDatas
                .Include(fd => fd.FragmentationImages)
                    .ThenInclude(fi => fi.FragmentationImageResults)
                .Where(fd => fd.Tanggal.Date == today && fd.Prioritas == priority)
                .FirstOrDefaultAsync();
            if (frag == null) return NotFound();
            return Ok(frag);
        }

        [HttpGet("next-priority")]
        public async Task<IActionResult> GetNextPriority([FromQuery] DateTime tanggal)
        {
            // find the maximum existing priority for that date
            var maxPriority = await _context.FragmentationDatas
                .Where(f => f.Tanggal.Date == tanggal.Date)
                .MaxAsync(f => (int?)f.Prioritas)
                ?? 0;

            // next one is max + 1
            return Ok(maxPriority + 1);
        }

    }
}
