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

# Example usage
if __name__ == "__main__":
    img_path = "input_frag/1.jpeg"
    output = "output_frag/1.jpeg"
    fragmentation_to_outline(img_path, output)

    