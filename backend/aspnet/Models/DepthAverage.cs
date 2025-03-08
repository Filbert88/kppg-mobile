using System;
using System.ComponentModel.DataAnnotations;

namespace aspnet.Models
{
    public class DepthAverage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public required string ImageUri { get; set; }

        public required string JumlahLubang { get; set; }

        public required string Lokasi { get; set; }

        public DateTime Tanggal { get; set; }

        public required string Kedalaman { get; set; }

        public required string Average { get; set; }

        public bool Synced { get; set; } = false;
    }
}
