import shutil
from OCR_Helper import ocr_pipeline, write_to_json
import os 
from pathlib import Path

def OCR(image_path, temp_folder='temp_ocr', output_folder='output_ocr'):

    os.makedirs(temp_folder, exist_ok=True)
    os.makedirs(output_folder, exist_ok=True)

    try:
        results = ocr_pipeline(image_path, temp_folder)
        print("OCR results: \n", results)
        print("Length: \n", len(results))
        base_name = Path(image_path).stem
        output_file = os.path.join(output_folder, f'res_{base_name}.json')
        write_to_json(results, output_file)
        
    except Exception as e:
        print(f"Error in OCR process: {e}")
        
    finally:
        if os.path.exists(temp_folder):
            shutil.rmtree(temp_folder)
            print(f"Deleted temp folder: {temp_folder}")
        pass
 
# if __name__ == "__main__":
#     img_path = "input_ocr/1.jpeg"
#     OCR(img_path)
    