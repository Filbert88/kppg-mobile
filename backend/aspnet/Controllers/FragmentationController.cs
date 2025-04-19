using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using aspnet.Data;
using aspnet.Models;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace aspnet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FragmentationController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly ApplicationDbContext _context;
        private readonly IHttpClientFactory _clientFactory;
        private readonly MyAppEnv _envSettings;

        public FragmentationController(IWebHostEnvironment env, ApplicationDbContext context, IHttpClientFactory clientFactory, IOptions<MyAppEnv> envSettings )
        {
            _env = env;
            _context = context;
            _clientFactory = clientFactory;
            _envSettings = envSettings.Value;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var allData = await _context.FragmentationDatas
                .Include(fd => fd.FragmentationImages)
                    .ThenInclude(fi => fi.FragmentationImageResults)
                .ToListAsync();

            var result = allData.Select(raw => new
            {
                raw.Id,
                raw.Skala,
                raw.Pilihan,
                raw.Ukuran,
                raw.Prioritas,
                raw.Lokasi,
                raw.Tanggal,
                raw.Litologi,
                raw.AmmoniumNitrate,
                raw.VolumeBlasting,
                raw.PowderFactor,
                raw.Synced,
                raw.DiggingTime,
                raw.VideoUri,
                fragmentationImages = raw.FragmentationImages.Select(fi => new
                {
                    fi.Id,
                    fi.ImageUri,
                    fi.Synced,
                    fragmentationImageResults = fi.FragmentationImageResults.Select(fr => new
                    {
                        fr.Id,
                        fr.Result1,
                        Result2 = SafeDeserialize(fr.Result2),
                        fr.Measurement,
                        fr.Synced
                    }).ToList()
                }).ToList()
            });

            return Ok(result);
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

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] FragmentationDataDto dto)
        {
            // 1) Priority conflict check
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

            // 2) Map to entity
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
                DiggingTime = dto.DiggingTime,
                VideoUri = dto.VideoUri,
                Synced = 1
            };

            // 3) Add images and results
            for (int i = 0; i < dto.UploadedImageUrls.Count; i++)
            {
                var image = new FragmentationImage
                {
                    ImageUri = dto.UploadedImageUrls[i],
                    Synced = 1
                };

                if (i < dto.FragmentedImageUrls.Count && i < dto.AnalysisJsonList.Count)
                {
                    image.FragmentationImageResults.Add(new FragmentationImageResult
                    {
                        Result1 = dto.FragmentedImageUrls[i], 
                        Result2 = JsonSerializer.Serialize(dto.AnalysisJsonList[i]), 
                        Synced = 1
                    });
                }

                entity.FragmentationImages.Add(image);
            }

            // 4) Save and return summary
            _context.FragmentationDatas.Add(entity);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = entity.Id,
                prioritas = entity.Prioritas,
                tanggal = entity.Tanggal
            });
        }

        [HttpDelete("clear-all")]
        public async Task<IActionResult> ClearAllData()
        {
            var allResults = await _context.FragmentationImageResults.ToListAsync();
            var allImages = await _context.FragmentationImages.ToListAsync();
            var allData = await _context.FragmentationDatas.ToListAsync();

            _context.FragmentationImageResults.RemoveRange(allResults);
            _context.FragmentationImages.RemoveRange(allImages);
            _context.FragmentationDatas.RemoveRange(allData);

            await _context.SaveChangesAsync();

            return Ok("All fragmentation data has been deleted.");
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
            var pythonApi = _envSettings.PythonBaseUrl;
            Console.WriteLine($"MASUKK {pythonApi}");

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
                    var response = await client.PostAsync($"{pythonApi}/fragmentation-red-outline", form);

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
                var pythonApi = _envSettings.PythonBaseUrl;
                var response = await client.PostAsync($"{pythonApi}/fragmentation-analysis", content);
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
        public async Task<IActionResult> GetTodayByPriority([FromQuery] int priority,[FromQuery] DateTime tanggal)
        {
            var tgl = tanggal.Date;

            // 1. Fetch raw data with includes
            var raw = await _context.FragmentationDatas
                .Include(fd => fd.FragmentationImages)
                    .ThenInclude(fi => fi.FragmentationImageResults)
                .Where(fd => fd.Tanggal.Date == tgl && fd.Prioritas == priority)
                .FirstOrDefaultAsync();

            if (raw == null) return NotFound();

            // 2. Manual projection + deserialization
            var result = new
            {
                raw.Id,
                raw.Skala,
                raw.Pilihan,
                raw.Ukuran,
                raw.Prioritas,
                raw.Lokasi,
                raw.Tanggal,
                raw.Litologi,
                raw.AmmoniumNitrate,
                raw.VolumeBlasting,
                raw.PowderFactor,
                raw.Synced,
                raw.DiggingTime,
                raw.VideoUri,
                fragmentationImages = raw.FragmentationImages.Select(fi => new
                {
                    fi.Id,
                    fi.ImageUri,
                    fi.Synced,
                    fragmentationImageResults = fi.FragmentationImageResults.Select(fr => new
                    {
                        fr.Id,
                        fr.Result1,
                        Result2 = SafeDeserialize(fr.Result2),
                        fr.Measurement,
                        fr.Synced
                    }).ToList()
                }).ToList()
            };

            return Ok(result);
        }

        // Utility to safely parse JSON or fallback to string
        private object? SafeDeserialize(string json)
        {
            try
            {
                return JsonSerializer.Deserialize<object>(json);
            }
            catch
            {
                return json; // fallback: return as-is if not valid JSON
            }
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
