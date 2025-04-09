using Microsoft.EntityFrameworkCore;
using aspnet.Models;

namespace aspnet.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<DepthAverage> DepthAverages { get; set; }
        public DbSet<FragmentationData> FragmentationDatas { get; set; }
        public DbSet<FragmentationImage> FragmentationImages { get; set; }
        public DbSet<FragmentationImageResult> FragmentationImageResults { get; set; }
    }
}
