from ocr_helper import ocr_pipeline, parse, parse_and_merge, write_to_json
import shutil
import os 
from pathlib import Path

def OCR(image_path, temp_folder='temp_ocr', output_folder='output_ocr'):
    """
    Main OCR function.
    
    Args:
        image_path: Path to the input image
        temp_folder: Folder for temporary files
        output_folder: Folder for output files
        
    Returns:
        None
    """
    # Create output directories
    os.makedirs(temp_folder, exist_ok=True)
    os.makedirs(output_folder, exist_ok=True)

    try:
        # Run OCR pipeline on the image
        results = ocr_pipeline(image_path, temp_folder)
        
        if not results:
            print(f"No results found for image: {image_path}")
            return
            
        # Convert results to list for processing
        result_list = []
        for file, texts in results.items():
            print(f"{file}: {texts}")
            result_list.append(texts)
            
        # Parse and process results
        parsed_results = parse(result_list)
        length, merged_results = parse_and_merge(parsed_results)
        print(f"Parsed results: {merged_results}")
        
        # Save results to JSON
        base_name = Path(image_path).stem
        output_file = os.path.join(output_folder, f'res_{base_name}.json')
        write_to_json(merged_results, output_file)
        print(f"Result saved to: {output_file}")
        
    except Exception as e:
        print(f"Error in OCR process: {e}")
        
    finally:
        # Uncomment to clean up temporary files
        if os.path.exists(temp_folder):
            shutil.rmtree(temp_folder)
            print(f"Deleted temp folder: {temp_folder}")
        pass
 

# Example usage
# Outputnya bakal kesimpen di "output_ocr/{nama img}.json"
# if __name__ == "__main__":
#     img_path = "input_ocr/ocr5.jpg"
#     OCR(img_path)
    