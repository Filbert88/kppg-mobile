using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using aspnet.Data;
using aspnet.Models;
using System.Threading.Tasks;

namespace aspnet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DepthAverageController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DepthAverageController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/DepthAverage
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var depthAverages = await _context.DepthAverages.ToListAsync();
            return Ok(depthAverages);
        }

        // GET: api/DepthAverage/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var depthAverage = await _context.DepthAverages.FindAsync(id);

            if (depthAverage == null)
                return NotFound();

            return Ok(depthAverage);
        }

        // POST: api/DepthAverage
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] List<DepthAverage> depthAverages)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            foreach (var newItem in depthAverages)
            {
                bool exists = await _context.DepthAverages
                    .AnyAsync(d => d.Tanggal.Date == newItem.Tanggal.Date && d.Prioritas == newItem.Prioritas);

                if (exists)
                {
                    return Conflict(new
                    {
                        message = $"Priority {newItem.Prioritas} on {newItem.Tanggal:yyyy-MM-dd} already exists.",
                        existingPriorities = await _context.DepthAverages
                            .Where(d => d.Tanggal.Date == newItem.Tanggal.Date)
                            .Select(d => d.Prioritas)
                            .ToListAsync()
                    });
                }
            }

            _context.DepthAverages.AddRange(depthAverages);
            await _context.SaveChangesAsync();

            return Ok(depthAverages);
        }

        // PUT: api/DepthAverage/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DepthAverage depthAverage)
        {
            if (id != depthAverage.Id)
                return BadRequest();

            _context.Entry(depthAverage).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await DepthAverageExists(id))
                    return NotFound();

                throw;
            }

            return NoContent();
        }

        // GET: api/DepthAverage/today?priority=…
        [HttpGet("today")]
        public async Task<IActionResult> GetToday([FromQuery] DateTime tanggal, [FromQuery] int priority)
        {
            var item = await _context.DepthAverages
                .Where(d => d.Tanggal.Date == tanggal.Date && d.Prioritas == priority)
                .FirstOrDefaultAsync();
            return item == null ? NotFound() : Ok(item);
        }

        // DELETE: api/DepthAverage/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var depthAverage = await _context.DepthAverages.FindAsync(id);
            if (depthAverage == null)
                return NotFound();

            _context.DepthAverages.Remove(depthAverage);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/DepthAverage/next-priority?tanggal=2025-04-10
        [HttpGet("next-priority")]  
        public async Task<IActionResult> GetNextPriority([FromQuery] DateTime tanggal)
        {
            var maxPriority = await _context.DepthAverages
                .Where(d => d.Tanggal.Date == tanggal.Date)
                .MaxAsync(d => (int?)d.Prioritas) ?? 0;

            return Ok(maxPriority + 1);
        }

        private async Task<bool> DepthAverageExists(int id)
        {
            return await _context.DepthAverages.AnyAsync(e => e.Id == id);
        }
    }
}
