'''
References:
- https://github.com/facebookresearch/segment-anything.git
https://colab.research.google.com/github/facebookresearch/segment-anything/blob/main/notebooks/automatic_mask_generator_example.ipynb
'''

import numpy as np
import torch
import matplotlib.pyplot as plt
import cv2
from skimage import measure
from segment_anything import sam_model_registry, SamAutomaticMaskGenerator
import os

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

    def show_anns(self, anns):
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

    def show_mask_outlines(self, anns, ax=None, outline_color='black'):
        if ax is None:
            ax = plt.gca()
        for ann in anns:
            mask = ann['segmentation']
            contours = measure.find_contours(mask, 0.5)
            for contour in contours:
                contour = np.fliplr(contour)
                ax.plot(contour[:, 0], contour[:, 1], linewidth=2, color=outline_color)

    def process_image(self, input_path, output_path):
        image = cv2.imread(input_path)
        if image is None:
            print(f"Error: Image not found at {input_path}")
            return
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        masks = self.generate_masks(image)
        print(f"Number of masks generated: {len(masks)}")
        if len(masks) > 0:
            print(f"Keys in first mask: {masks[0].keys()}")

        white_background = np.ones_like(image) * 255
        plt.figure(figsize=(20, 20))
        plt.imshow(white_background)
        self.show_mask_outlines(masks, outline_color='black')
        plt.axis('off')

        plt.savefig(output_path, bbox_inches='tight', pad_inches=0)
        print(f"Output saved to {output_path}")

