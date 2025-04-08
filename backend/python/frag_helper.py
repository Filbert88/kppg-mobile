'''
References:
- https://github.com/facebookresearch/segment-anything.git
  Meta AI's Segment Anything Model is licensed under the Apache License, Version 2.0
  For the full license text, please see: https://github.com/facebookresearch/segment-anything/blob/main/LICENSE

- Example notebook: https://colab.research.google.com/github/facebookresearch/segment-anything/blob/main/notebooks/automatic_mask_generator_example.ipynb

This implementation uses the Segment Anything Model (SAM) developed by Meta AI.
'''

import numpy as np
import torch
import matplotlib.pyplot as plt
import cv2
from skimage import measure
from segment_anything import sam_model_registry, SamAutomaticMaskGenerator
import os

class SegmentAnythingPipeline:
    """Pipeline for segmenting objects in images using the Segment Anything Model (SAM)."""
    
    def __init__(self, model_type="vit_h", checkpoint_path="sam_vit_h_4b8939.pth", device=None):
        """Initialize the SAM pipeline with the specified model configuration."""
        self.model_type = model_type
        self.checkpoint_path = checkpoint_path
        self.device = device if device else ("cuda" if torch.cuda.is_available() else "cpu")
        self.sam = self.load_model()

    def load_model(self):
        """Load the SAM model using the specified checkpoint."""
        model = sam_model_registry[self.model_type](checkpoint=self.checkpoint_path)
        model.to(device=self.device)
        return model

    def generate_masks(self, image):
        """Generate segmentation masks for all objects in the image."""
        mask_generator = SamAutomaticMaskGenerator(self.sam)
        masks = mask_generator.generate(image)
        return masks

    def show_anns(self, anns):
        """Display annotations as colored masks with transparency."""
        if len(anns) == 0:
            return
        sorted_anns = sorted(anns, key=lambda x: x['area'], reverse=True)
        ax = plt.gca()
        ax.set_autoscale_on(False)

        img = np.ones((sorted_anns[0]['segmentation'].shape[0], sorted_anns[0]['segmentation'].shape[1], 4))
        img[:, :, 3] = 0
        for ann in sorted_anns:
            m = ann['segmentation']
            color_mask = np.concatenate([np.random.random(3), [0.35]])
            img[m] = color_mask
        ax.imshow(img)

    def show_mask_outlines(self, image, anns, output_path, outline_color=(255, 0, 0)):
        """Draw mask outlines on the original image and save the result."""
        # Create a copy of the original image
        result_image = image.copy()
        
        # Convert to BGR for OpenCV
        if result_image.shape[2] == 3 and outline_color == (255, 0, 0):
            # Image is RGB, but OpenCV uses BGR
            cv_outline_color = (255, 0, 0)  # BGR for red
        else:
            cv_outline_color = outline_color
            
        # Draw contours on the image
        for ann in anns:
            mask = ann['segmentation'].astype(np.uint8)
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(result_image, contours, -1, cv_outline_color, 2)
        
        # Save the result
        if result_image.shape[2] == 3:
            # Convert back to BGR for saving with OpenCV
            result_image_bgr = cv2.cvtColor(result_image, cv2.COLOR_RGB2BGR)
            cv2.imwrite(output_path, result_image_bgr)
        else:
            cv2.imwrite(output_path, result_image)
            
        print(f"Output saved to {output_path}")
        return result_image

    def process_image(self, input_path, output_path):
        """Process an image by generating segmentation masks and drawing outlines on the original image."""
        image = cv2.imread(input_path)
        if image is None:
            print(f"Error: Image not found at {input_path}")
            return
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        masks = self.generate_masks(image)
        print(f"Number of masks generated: {len(masks)}")
        
        # Process image with red outlines
        result = self.show_mask_outlines(image, masks, output_path, outline_color=(255, 0, 0))
        return result

