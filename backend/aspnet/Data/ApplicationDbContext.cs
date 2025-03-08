using Microsoft.EntityFrameworkCore;
using aspnet.Models;

namespace aspnet.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<DepthAverage> DepthAverages { get; set; }
    }
}
