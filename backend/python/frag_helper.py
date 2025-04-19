import os
import numpy as np
import torch
import cv2
from segment_anything import sam_model_registry, SamAutomaticMaskGenerator

class SegmentAnythingPipeline:
    def __init__(self, model_type="vit_h", checkpoint_path="sam_vit_h_4b8939.pth", device=None):
        self.model_type = model_type
        self.checkpoint_path = checkpoint_path
        self.device = device if device else ("cuda" if torch.cuda.is_available() else "cpu")
        self.sam = self.load_model()

    def load_model(self):
        model = sam_model_registry[self.model_type](checkpoint=self.checkpoint_path)
        model.to(device=self.device)
        return model

    def generate_masks(self, image):
        mask_generator = SamAutomaticMaskGenerator(self.sam)
        masks = mask_generator.generate(image)
        return masks

        

    def save_segmentation_result(self, image, masks, output_path):
        # Create a black background image with white regions and black outlines
        height, width = image.shape[:2]
        result_mask = np.zeros((height, width), dtype=np.uint8)  # Black background
        
        # Draw all masks as white regions
        for mask in masks:
            seg = mask['segmentation'].astype(np.uint8)
            result_mask[seg > 0] = 255  # Set segmented areas to white
        
        # Draw contours in black
        for mask in masks:
            seg = mask['segmentation'].astype(np.uint8)
            contours, _ = cv2.findContours(seg.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(result_mask, contours, -1, 0, 1)  # Black outlines
        
        # Save the result mask
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, result_mask)
        print(f"Saved segmentation result to {output_path}")

    def save_cutouts(self, image, masks, output_dir, image_name):
        # Create the output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Sort masks by area in descending order
        sorted_masks = sorted(masks, key=lambda x: x['area'], reverse=True)

        for i, ann in enumerate(sorted_masks):
            # Create a mask for the current object
            object_mask = ann['segmentation']
            
            # Create a masked image for this object
            masked_image = image.copy()
            masked_image[~object_mask] = 255  # Set non-mask areas to white
            
            # Crop the image to the bounding box of the mask
            y_indices, x_indices = np.where(object_mask)
            y_min, y_max = y_indices.min(), y_indices.max()
            x_min, x_max = x_indices.min(), x_indices.max()
            
            cropped_image = masked_image[y_min:y_max+1, x_min:x_max+1]
            
            # Save the cropped image
            output_filename = os.path.join(output_dir,  f"cutout_{image_name}_{i+1}.png")
            cv2.imwrite(output_filename, cv2.cvtColor(cropped_image, cv2.COLOR_RGB2BGR))
            print(f"Saved object {i+1} to {output_filename}")

    def process_image(self, input_path, output_dir="output_frag"):
        # Get image name and extension
        image_basename = os.path.basename(input_path)
        image_name, _ = os.path.splitext(image_basename)

        # Create output directories
        os.makedirs(output_dir, exist_ok=True)

        # Read the image
        image = cv2.imread(input_path)
        if image is None:
            print(f"Error: Image not found at {input_path}")
            return
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Generate masks
        masks = self.generate_masks(image)
        print(f"Number of masks generated: {len(masks)}")

        # Save main segmentation result
        result_path = os.path.join(output_dir, f"res_{image_name}.jpg")
        self.save_segmentation_result(image, masks, result_path)

        # Save cutouts to a properly named directory
        cutouts_dir = os.path.join(output_dir, f"cutouts_{image_name}")
        self.save_cutouts(image, masks, cutouts_dir, image_name)

        return result_path