using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace aspnet.Models
{
    public class FragmentationImage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int FragmentationDataId { get; set; }

        [Required]
        public string ImageUri { get; set; } = "";

        [Required]
        public int Synced { get; set; } = 0;

        [JsonIgnore]
        [ForeignKey("FragmentationDataId")]
        public FragmentationData? FragmentationData { get; set; }

        public ICollection<FragmentationImageResult> FragmentationImageResults { get; set; } = new List<FragmentationImageResult>();
    }
}
