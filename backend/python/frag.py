from frag_helper import SegmentAnythingPipeline
import os 
import cv2
import numpy as np
import matplotlib.pyplot as plt

def fragmentation_to_outline(input_path, output_dir="output_frag"):
    """
    Process an image to identify and outline fragmented objects.
    
    Args:
        input_path: Path to the input image file
        output_path: Path where the output image with outlines will be saved
    """
    pipeline = SegmentAnythingPipeline()
    # Call process_image, which returns the full path to the result
    result_path = pipeline.process_image(input_path, output_dir)
    
    # Read the saved output image back into a NumPy array
    output_image = cv2.imread(result_path, cv2.IMREAD_COLOR)
    if output_image is None:
        raise ValueError("Failed to load the segmentation result image.")
    
    # Optionally, remove the file if you don't need to keep it on disk
    # os.remove(result_path)
    
    return output_image

# def fragmentation_to_blackwhite(input_path, output_path=None, line_thickness=3):
#     """
#     Convert an image with colored outlines to a black and white outline drawing.
    
#     Args:
#         input_path (str): Path to the input image file
#         output_path (str, optional): Path to save the output image. If None, will use input filename + "_outline.jpg"
#         line_thickness (int, optional): Thickness of the outlines in the result
        
#     Returns:
#         str: Path to the saved output image
#     """
#     # Create output path if not provided
#     if output_path is None:
#         base_name = os.path.splitext(input_path)[0]
#         output_path = f"{base_name}_outline.jpg"
    
#     # Read the image
#     image = cv2.imread(input_path)
#     if image is None:
#         raise ValueError(f"Could not read image from {input_path}")
    
#     # Extract the red channel which will have stronger values where the lines are
#     b, g, r = cv2.split(image)
    
#     # Create a blank white image
#     height, width = image.shape[:2]
#     white_canvas = np.ones((height, width), dtype=np.uint8) * 255
    
#     # Detect red outlines
#     red_mask = ((r > 220) & (g < 35) & (b < 35)).astype(np.uint8) * 255
    
#     # Dilate to make lines more visible if needed
#     if line_thickness > 1:
#         kernel = np.ones((line_thickness, line_thickness), np.uint8)
#         red_mask = cv2.dilate(red_mask, kernel, iterations=1)
    
#     # Create the final image: white background with black lines
#     result = white_canvas.copy()
#     result[red_mask > 0] = 0
    
#     # Save the result
#     cv2.imwrite(output_path, result)
#     print(f"Outline drawing saved to {output_path}")
    
#     return output_path

# Example usage
if __name__ == "__main__":
    img_path = "input_frag/1.jpeg"
    output = "output_frag/res_1.jpeg"
    fragmentation_to_outline(img_path, output)

    