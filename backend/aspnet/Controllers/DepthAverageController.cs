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
        public async Task<IActionResult> Create([FromBody] DepthAverage depthAverage)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _context.DepthAverages.Add(depthAverage);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = depthAverage.Id }, depthAverage);
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

        private async Task<bool> DepthAverageExists(int id)
        {
            return await _context.DepthAverages.AnyAsync(e => e.Id == id);
        }
    }
}
