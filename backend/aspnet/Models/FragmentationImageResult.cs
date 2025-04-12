using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace aspnet.Models
{
    public class FragmentationImageResult
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int FragmentationImageId { get; set; }

        public string Result1 { get; set; } = "";
        public string Result2 { get; set; } = "";

        public string Measurement { get; set; } = "";

        [Required]
        public int Synced { get; set; } = 0;

        [ForeignKey("FragmentationImageId")]
        public FragmentationImage? FragmentationImage { get; set; }
    }
}
