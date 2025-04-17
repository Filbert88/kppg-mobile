using System;
using System.Collections.Generic;
using System.Text.Json;

namespace aspnet.Models
{
    // what the client will POST / PUT
    public class FragmentationDataDto
    {
        public string Skala { get; set; } = "";
        public string Pilihan { get; set; } = "";
        public string Ukuran { get; set; } = "";
        public int Prioritas { get; set; }
        public string Lokasi { get; set; } = "";
        public DateTime Tanggal { get; set; }
        public string Litologi { get; set; } = "";
        public string AmmoniumNitrate { get; set; } = "";
        public string VolumeBlasting { get; set; } = "";
        public string PowderFactor { get; set; } = "";
        public string? DiggingTime { get; set; }
        public string? VideoUri { get; set; }

        public List<string> PlotImageUrls { get; set; } = new();  // instead of just one
        public List<object> AnalysisJsonList { get; set; } = new(); // instead of just one


        // Raw uploaded image URLs from image picker
        public List<string> UploadedImageUrls { get; set; } = new();

        // Fragmented result images (base64 or final URLs)
        public List<string> FragmentedImageUrls { get; set; } = new();
    }

    public class FragmentedResultDto
    {
        public string ImageDataUrl { get; set; } = "";
        public double ConversionFactor { get; set; }
        public JsonElement AnalysisJson { get; set; }
    }
}
