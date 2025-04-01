using System;
using System.ComponentModel.DataAnnotations;

namespace aspnet.Models
{
    public class DepthAverage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ImageUri { get; set; } = "default_uri";

        [Required]
        public string JumlahLubang { get; set; } = "N/A";

        [Required]
        public string Lokasi { get; set; } = "Unknown";

        [Required]
        public string Kedalaman { get; set; } = "{}";

        [Required]
        public string Average { get; set; } = "0";

        public DateTime Tanggal { get; set; } = DateTime.Now;

        [Required]
        [Range(0, 1)]
        public int Synced { get; set; } = 0;
    }
}
