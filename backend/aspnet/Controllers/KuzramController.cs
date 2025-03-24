using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace aspnet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KuzramController : ControllerBase
    {
        [HttpPost("calculate")]
        public async Task<IActionResult> Calculate([FromBody] KuzramRequest request)
        {
            if (request == null)
            {
                return BadRequest("No request payload provided.");
            }

            var jsonPayload = JsonSerializer.Serialize(request);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var pythonUrl = "http://localhost:5000/kuzram";
            using (var httpClient = new HttpClient())
            {
                var response = await httpClient.PostAsync(pythonUrl, content);
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, "Error calling Python Kuz-Ram service.");
                }
                var responseString = await response.Content.ReadAsStringAsync();
                return Content(responseString, "application/json");
            }
        }
    }

    public class KuzramRequest
    {
        public double A { get; set; }
        public double K { get; set; }
        public double Q { get; set; }
        public double E { get; set; }
        public double n { get; set; }
    }
}
