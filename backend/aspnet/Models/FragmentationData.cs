using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace aspnet.Models
{
    public class FragmentationData
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Skala { get; set; } = "";

        [Required]
        public string Pilihan { get; set; } = "";

        [Required]
        public string Ukuran { get; set; } = "";

        [Required]
        public int Prioritas { get; set; } = 0;

        [Required]
        public string Lokasi { get; set; } = "";

        // Adjust the type if you want to store as string; using DateTime for strong typing.
        public DateTime Tanggal { get; set; } = DateTime.Now;

        [Required]
        public string Litologi { get; set; } = "";

        [Required]
        public string AmmoniumNitrate { get; set; } = "";

        [Required]
        public string VolumeBlasting { get; set; } = "";

        [Required]
        public string PowderFactor { get; set; } = "";

        [Required]
        public int Synced { get; set; } = 0;

        // Navigation property for related images
        public ICollection<FragmentationImage> FragmentationImages { get; set; } = new List<FragmentationImage>();
    }
}
