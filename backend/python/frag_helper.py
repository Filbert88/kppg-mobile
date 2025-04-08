import numpy as np
import torch
import matplotlib.pyplot as plt
import cv2
from segment_anything import sam_model_registry, SamAutomaticMaskGenerator

class SegmentAnythingPipeline:
    """Pipeline for segmenting objects in images using the Segment Anything Model (SAM)."""
    
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

    def generate_masked_image_with_black_bg(self, image, anns, output_path):
        """Generate an image with black background, white objects, and gray outlines."""
        output = np.zeros_like(image)

        for mask in anns:
            seg = mask['segmentation'].astype(np.uint8) * 255
            contours, _ = cv2.findContours(seg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            # Fill object area with white
            output[seg == 255] = [255, 255, 255]

            # Draw bold gray outline
            cv2.drawContours(output, contours, -1, (100, 100, 100), thickness=4)

        # Save output
        output_bgr = cv2.cvtColor(output, cv2.COLOR_RGB2BGR)
        cv2.imwrite(output_path, output_bgr)
        print(f"Output saved to {output_path}")
        return output

    def process_image(self, input_path, output_path):
        image = cv2.imread(input_path)
        if image is None:
            print(f"Error: Image not found at {input_path}")
            return
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        masks = self.generate_masks(image)
        print(f"Number of masks generated: {len(masks)}")

        result = self.generate_masked_image_with_black_bg(image, masks, output_path)
        return result
