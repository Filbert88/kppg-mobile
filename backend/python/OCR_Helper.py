from collections import defaultdict
import os
import re
import cv2
import numpy as np
from PIL import Image
import json
from pathlib import Path
import matplotlib.pyplot as plt
import shutil
import re 

from paddleocr import PaddleOCR, draw_ocr
# https://github.com/PaddlePaddle/PaddleOCR.git

def detect_red_box_corners(image_path):
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("detect_red_box_corners: Image not found.")
    original = image.copy()
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Create red mask
    lower_red1 = np.array([0, 70, 50])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([160, 70, 50])
    upper_red2 = np.array([180, 255, 255])
    mask = cv2.inRange(hsv, lower_red1, upper_red1) | cv2.inRange(hsv, lower_red2, upper_red2)

    # Enhance lines
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=2)
    edges = cv2.Canny(mask, 50, 150)

    # Hough line detection
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=200, maxLineGap=20)
    if lines is None:
        raise ValueError("detect_red_box_corners: No lines detected.")

    verticals, horizontals = [], []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        if abs(x1 - x2) < 20:
            verticals.append((x1, y1, x2, y2))
        elif abs(y1 - y2) < 20:
            horizontals.append((x1, y1, x2, y2))

    if not verticals or not horizontals:
        raise ValueError("detect_red_box_corners: Could not detect vertical and horizontal lines.")

    left = min(verticals, key=lambda l: l[0])
    right = max(verticals, key=lambda l: l[0])
    top = min(horizontals, key=lambda l: l[1])
    bottom = max(horizontals, key=lambda l: l[1])

    def intersect(l1, l2):
        x1, y1, x2, y2 = l1
        x3, y3, x4, y4 = l2
        A1 = y2 - y1
        B1 = x1 - x2
        C1 = A1 * x1 + B1 * y1
        A2 = y4 - y3
        B2 = x3 - x4
        C2 = A2 * x3 + B2 * y3
        det = A1 * B2 - A2 * B1
        if det == 0:
            return None
        x = (B2 * C1 - B1 * C2) / det
        y = (A1 * C2 - A2 * C1) / det
        return int(x), int(y)

    corners = [intersect(left, top), intersect(right, top),
               intersect(right, bottom), intersect(left, bottom)]

    # Show with green dots (optional)
    for pt in corners:
        if pt:
            cv2.circle(original, pt, 8, (0, 255, 0), -1)

    return corners

def reorder_corners(pts):
    """
    Reorders 4 points into: top-left, top-right, bottom-right, bottom-left.
    """
    pts = np.array(pts, dtype="float32")
    rect = np.zeros((4, 2), dtype="float32")

    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)

    rect[0] = pts[np.argmin(s)]  # top-left
    rect[2] = pts[np.argmax(s)]  # bottom-right
    rect[1] = pts[np.argmin(diff)]  # top-right
    rect[3] = pts[np.argmax(diff)]  # bottom-left

    return rect

def extract_by_corners(image_path, corners, output_path='temp_ocr/red_box/cropped.jpg'):
    """
    Apply precise perspective transform to extract content based on 4 corner points.

    Args:
        image_path (str): Path to the input image.
        corners (list): List of four (x, y) tuples (not guaranteed ordered).
        output_path (str): Where to save the extracted image.

    Returns:
        (np.ndarray, str): Warped image and saved path.
    """
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("extract_by_corners: Image not found at " + image_path)

    if len(corners) != 4 or any(c is None for c in corners):
        raise ValueError("extract_by_corners: Invalid corners. Must contain 4 non-None points.")

    # Reorder corners for accuracy
    pts1 = reorder_corners(corners)

    widthA = np.linalg.norm(pts1[2] - pts1[3])
    widthB = np.linalg.norm(pts1[1] - pts1[0])
    maxWidth = int(round(max(widthA, widthB)))

    heightA = np.linalg.norm(pts1[1] - pts1[2])
    heightB = np.linalg.norm(pts1[0] - pts1[3])
    maxHeight = int(round(max(heightA, heightB)))

    pts2 = np.float32([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ])

    matrix = cv2.getPerspectiveTransform(pts1, pts2)
    warped = cv2.warpPerspective(image, matrix, (maxWidth, maxHeight))

    warped = warped[2:, 2:]

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, warped)

def extract_rows(img_path='temp_ocr/red_box/cropped.jpg', output_base="temp_ocr/rows"):
    """
    Precisely divide an image into 30 equally tall rows and save each as a single image.

    Args:
        img_path (str): Input image path.
        output_base (str): Directory to save output slices.

    Returns:
        list: Paths to saved image lines.
    """
    os.makedirs(output_base, exist_ok=True)
    image = cv2.imread(img_path)
    if image is None:
        raise ValueError(f"extract_rows: Could not read image from {img_path}")
    
    height, width = image.shape[:2]
    exact_line_height = height / 30.0

    output_files = []
    y_current = 0.0

    for i in range(30):
        y_next = y_current + exact_line_height
        y_start = max(0, int(round(y_current) - 2))
        y_end = min(height, int(round(y_next) + 2))


        filename = f"line_{i+1:02d}.jpg"
        output_path = os.path.join(output_base, filename)

        if not os.path.exists(output_path):
            cv2.imwrite(output_path, image[y_start:y_end, :])
            output_files.append(output_path)

        y_current = y_next

def extract_cell(input_folder="temp_ocr/rows", output_folder="temp_ocr/cells"):
    """
    Slice each line image into cells based on row parity:
    - Odd rows → 19 equal columns
    - Even rows → crop 0.5 cell-width from both sides, then divide into 18
    - Adds 3px padding left and right (if in image bounds)

    Args:
        input_folder (str): Folder with line images.
        output_folder (str): Folder to save individual cell images.
    """

    os.makedirs(output_folder, exist_ok=True)
    files = sorted(Path(input_folder).glob("line_*.jpg"))

    for file_path in files:
        
        img = cv2.imread(str(file_path))
        if img is None:
            continue

        filename = file_path.stem
        row_number = int(filename.split("_")[1])
        line_label = f"{row_number:02d}"

        h, w = img.shape[:2]
        num_cells = 19 if row_number % 2 == 1 else 18
        cell_width = w / 19
        crop = 0 if row_number % 2 == 1 else 0.5 * cell_width

        x_start = crop
        x_end = w - crop
        actual_cell_width = (x_end - x_start) / num_cells


        for i in range(num_cells):
            cx_float_start = x_start + i * actual_cell_width
            cx_float_end = x_start + (i + 1) * actual_cell_width

            # Add padding but keep inside image bounds
            x1 = max(0, int(round(cx_float_start)) - 2)
            x2 = min(w, int(round(cx_float_end)) + 12)

            cell_img = img[:, x1:x2]

            out_name = f"cell_{line_label}_{i+1:02d}.jpg"
            out_path = os.path.join(output_folder, out_name)
            cv2.imwrite(out_path, cell_img)

def upscale_image(folder_input='temp_ocr/cells', folder_output='temp_ocr/upscaled_cells', scale=12.0):
    """
    Upscale all images in a folder and save them to another folder.

    Args:
        folder_input (str): Path to input folder
        folder_output (str): Path to output folder
        scale (float): Scale factor for upscaling (e.g., 2.0 = 2x)
    """
    os.makedirs(folder_output, exist_ok=True)
    image_files = list(Path(folder_input).glob("*.[jp][pn]g"))  # .jpg and .png

    for path in image_files:
        img = cv2.imread(str(path))
        if img is None:
            print(f"[Skipped] Could not read {path.name}")
            continue

        # Upscale using INTER_CUBIC for quality
        upscaled = cv2.resize(
            img, 
            None, 
            fx=scale, 
            fy=scale, 
            interpolation=cv2.INTER_CUBIC
        )

        out_path = os.path.join(folder_output, path.name)
        cv2.imwrite(out_path, upscaled)
        # print(f"[Saved] {out_path}")

def add_padding(input_folder='temp_ocr/upscaled_cells', output_folder='temp_ocr/pad_cells'):
    """
    Add 20px white padding to all sides of each image in input_folder,
    and save the result to output_folder using the same filenames.

    Args:
        input_folder (str): Folder containing source images.
        output_folder (str): Folder to save padded images.
    """
    os.makedirs(output_folder, exist_ok=True)
    files = sorted(Path(input_folder).glob("*.[jp][pn]g"))  # match .jpg/.png

    for file_path in files:
        img = cv2.imread(str(file_path))
        if img is None:
            continue

        padded_img = cv2.copyMakeBorder(
            img,
            top=100, bottom=100, left=100, right=100,
            borderType=cv2.BORDER_CONSTANT,
            value=(119,118,114,255)  # white padding
        )

        out_path = os.path.join(output_folder, file_path.name)
        cv2.imwrite(out_path, padded_img)

def merge_line(input_folder='temp_ocr/pad_cells', output_folder='temp_ocr/merged_line'):
    
    # # Create output directory if it doesn't exist
    # os.makedirs(output_folder, exist_ok=True)
    
    # # Create a debug folder to save intermediate images
    # debug_folder = os.path.join(output_folder, "debug")
    # os.makedirs(debug_folder, exist_ok=True)
    
    # # Clear previous debug images
    # for file in os.listdir(debug_folder):
    #     file_path = os.path.join(debug_folder, file)
    #     if os.path.isfile(file_path):
    #         os.unlink(file_path)
    
    # grouped = defaultdict(list)
    # # Group by row number
    # for file_path in Path(input_folder).glob("cell_*.jpg"):
    #     parts = file_path.stem.split("_")
    #     if len(parts) == 3:
    #         row = parts[1]
    #         col = int(parts[2])
    #         grouped[row].append((col, file_path))
    
    # # Process each row
    # for row, items in grouped.items():
    #     # print(f"\n[Processing] Row {row} with {len(items)} cells")
        
    #     # Sort by column number
    #     sorted_items = sorted(items, key=lambda x: x[0])
    #     images = []
    #     valid_images = []
    #     min_width = float('inf')
        
    #     # First pass: collect and validate images
    #     for idx, (col, path) in enumerate(sorted_items):
    #         # Read the image
    #         img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    #         if img is None:
    #             print(f"[Error] Cannot read {path}")
    #             continue
            
    #         # Save original image for debugging
    #         debug_path = os.path.join(debug_folder, f"original_r{row}_c{col}.jpg")
    #         cv2.imwrite(debug_path, img)
            
    #         # Basic image info
    #         # print(f"Image {idx} (col {col}): shape={img.shape}, dtype={img.dtype}, mean={np.mean(img):.1f}")
            
    #         # Make sure image has 3 channels (BGR)
    #         if len(img.shape) == 2:
    #             img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    #             # print(f"  - Converted grayscale to BGR")
    #         elif img.shape[2] == 4:  # RGBA
    #             img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    #             # print(f"  - Converted RGBA to BGR")
            
    #         # Skip if image is completely white
    #         white_threshold = 250
    #         if np.mean(img) >= white_threshold:
    #             print(f"  - [Skipped] Image is too white (mean={np.mean(img):.1f})")
    #             continue
            
    #         # Store the image
    #         images.append(img)
    #         valid_images.append((col, img))
            
    #         # Track minimum width (for small images)
    #         if img.shape[1] < min_width:
    #             min_width = img.shape[1]
        
    #     if not valid_images:
    #         print(f"[Skipped] Row {row} not merged (no valid images)")
    #         continue
        
    #     # Ensure minimum width is reasonable
    #     if min_width < 5:
    #         min_width = 5  # Set a minimum width to avoid extremely thin images
    #         print(f"  - Adjusted minimum width to {min_width} pixels")
        
    #     # Calculate the median height for better consistency
    #     heights = [img.shape[0] for _, img in valid_images]
    #     target_height = max(img.shape[0] for _, img in valid_images)

    #     widths = [img.shape[1] for _, img in valid_images]
    #     target_width = int(np.median(widths))
        
    #     # print(f"Target height: {target_height}, Minimum width: {min_width}")
        
    #     # Second pass: resize images to consistent height
    #     processed_images = []
    #     for col, img in valid_images:
    #         # Resize to target height while preserving aspect ratio
    #         aspect = img.shape[1] / img.shape[0]
    #         new_width = max(int(target_height * aspect), min_width)
            
    #         # Use INTER_AREA for downsampling, INTER_LINEAR for upsampling
    #         interpolation = cv2.INTER_AREA if img.shape[0] > target_height else cv2.INTER_LINEAR
    #         resized = cv2.resize(img, (target_width, target_height), interpolation=interpolation)
    #         resized = resized.astype(np.uint8)
            
            
    #         # Save resized image for debugging
    #         debug_path = os.path.join(debug_folder, f"resized_r{row}_c{col}.jpg")
    #         cv2.imwrite(debug_path, resized)
            
    #         # Enhance contrast for small images
    #         if new_width < 20 or target_height < 20:
    #             # print(f"  - Enhancing contrast for small image (col {col})")
    #             # Convert to LAB color space
    #             lab = cv2.cvtColor(resized, cv2.COLOR_BGR2LAB)
    #             l, a, b = cv2.split(lab)
    #             # Apply CLAHE to L channel
    #             clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    #             cl = clahe.apply(l)
    #             # Merge channels
    #             limg = cv2.merge((cl, a, b))
    #             # Convert back to BGR
    #             resized = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
                
    #             # Save enhanced image
    #             debug_path = os.path.join(debug_folder, f"enhanced_r{row}_c{col}.jpg")
    #             cv2.imwrite(debug_path, resized)
            
    #         processed_images.append(resized)
        
    #     # Handle special case of single image
    #     if len(processed_images) == 1:
    #         out_path = os.path.join(output_folder, f"line_merged_{row}.jpg")
    #         cv2.imwrite(out_path, processed_images[0])
    #         # print(f"[Saved] {out_path} (single image)")
    #         # Also copy to debug folder
    #         shutil.copy(out_path, os.path.join(debug_folder, f"final_r{row}.jpg"))
    #         continue
        
    #     try:
    #         # Ensure all images have compatible types
    #         for i in range(len(processed_images)):
    #             processed_images[i] = processed_images[i].astype(np.uint8)
            
    #         # Create a border around each image to help visualize the concatenation
    #         bordered_images = []
    #         for img in processed_images:
    #             bordered = cv2.copyMakeBorder(
    #                 img, 
    #                 top=1, bottom=1, left=1, right=1,
    #                 borderType=cv2.BORDER_CONSTANT,
    #                 value=[0, 0, 255]  # Red border
    #             )
    #             bordered_images.append(bordered)
            
    #         # Save bordered images
    #         for i, img in enumerate(bordered_images):
    #             debug_path = os.path.join(debug_folder, f"bordered_r{row}_c{i}.jpg")
    #             cv2.imwrite(debug_path, img)
            
    #         # Try to concatenate with borders
    #         try:
    #             merged_with_borders = cv2.hconcat(bordered_images)
    #             debug_path = os.path.join(debug_folder, f"merged_with_borders_r{row}.jpg")
    #             cv2.imwrite(debug_path, merged_with_borders)
    #         except Exception as e:
    #             print(f"  - Failed to merge with borders: {e}")
            
    #         # Concatenate the original processed images
    #         merged = cv2.vconcat(processed_images)
            
    #         # Apply additional contrast enhancement to the merged image
    #         lab = cv2.cvtColor(merged, cv2.COLOR_BGR2LAB)
    #         l, a, b = cv2.split(lab)
    #         clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    #         cl = clahe.apply(l)
    #         limg = cv2.merge((cl, a, b))
    #         final_img = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
            
    #         # Save the pre-contrast enhanced version for debugging
    #         debug_path = os.path.join(debug_folder, f"pre_contrast_r{row}.jpg")
    #         cv2.imwrite(debug_path, merged)
            
    #         # Save the final merged image
    #         out_path = os.path.join(output_folder, f"line_merged_{row}.jpg")
    #         cv2.imwrite(out_path, final_img)
            
    #         # Also save to debug folder
    #         shutil.copy(out_path, os.path.join(debug_folder, f"final_r{row}.jpg"))
            
    #         # print(f"[Saved] {out_path}")
            
    #         # Check if the output is still too white
    #         if np.mean(final_img) >= 250:
    #             print(f"[Warning] Merged image is still very white (mean={np.mean(final_img):.1f})")
                
    #     except Exception as e:
    #         print(f"[Failed] Merging row {row}: {e}")
    #         # Print shape info
    #         # for i, img in enumerate(processed_images):
    #             # print(f"  Image {i} shape: {img.shape}, dtype: {img.dtype}")
            
    #         # Try to save individual processed images for debugging
    #         for i, img in enumerate(processed_images):
    #             try:
    #                 debug_path = os.path.join(debug_folder, f"failed_concat_r{row}_c{i}.jpg")
    #                 cv2.imwrite(debug_path, img)
    #             except Exception as e2:
    #                 print(f"  - Failed to save debug image {i}: {e2}")
    return

def merge_line(input_folder='temp_ocr/pad_cells', output_folder='temp_ocr/merged_line', cells_per_row=3):
    os.makedirs(output_folder, exist_ok=True)
    debug_folder = os.path.join(output_folder, "debug")
    os.makedirs(debug_folder, exist_ok=True)

    # Clear debug folder
    for file in os.listdir(debug_folder):
        file_path = os.path.join(debug_folder, file)
        if os.path.isfile(file_path):
            os.unlink(file_path)

    grouped = defaultdict(list)

    for file_path in Path(input_folder).glob("cell_*.jpg"):
        parts = file_path.stem.split("_")
        if len(parts) == 3:
            row = parts[1]
            col = int(parts[2])
            grouped[row].append((col, file_path))

    for row, items in grouped.items():
        sorted_items = sorted(items, key=lambda x: x[0])
        images = []

        for col, path in sorted_items:
            img = cv2.imread(str(path))
            if img is None:
                continue

            # Ensure 3-channel BGR
            if len(img.shape) == 2:
                img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
            elif img.shape[2] == 4:
                img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

            if np.mean(img) >= 250:
                continue

            images.append(img)

        if not images:
            print(f"[Skipped] Row {row}: no valid images")
            continue

        # Resize to consistent height
        target_height = max(img.shape[0] for img in images)
        resized_images = [
            cv2.resize(img, (int(img.shape[1] * (target_height / img.shape[0])), target_height), interpolation=cv2.INTER_LINEAR)
            for img in images
        ]

        # Split into chunks of 3 cells
        row_chunks = [resized_images[i:i + cells_per_row] for i in range(0, len(resized_images), cells_per_row)]

        # Horizontally merge each row group
        merged_rows = []
        for i, row_imgs in enumerate(row_chunks):
            # Match row height
            h = target_height
            row_imgs = [cv2.resize(img, (img.shape[1], h)) for img in row_imgs]
            row_merged = cv2.hconcat(row_imgs).astype(np.uint8)
            merged_rows.append(row_merged)

        # Ensure consistent width for vconcat
        target_width = max(row.shape[1] for row in merged_rows)
        merged_rows = [
            cv2.resize(row, (target_width, row.shape[0]), interpolation=cv2.INTER_LINEAR).astype(np.uint8)
            for row in merged_rows
        ]

        final_img = cv2.vconcat(merged_rows)

        out_path = os.path.join(output_folder, f"line_merged_{row}.jpg")
        cv2.imwrite(out_path, final_img)
        shutil.copy(out_path, os.path.join(debug_folder, f"final_r{row}.jpg"))
        print(f"[Saved] {out_path}")

def increase_brightness(input_folder='temp_ocr/merged_line', output_folder='temp_ocr/final', beta=40):
    """
    Increase brightness of all images in a folder and save them to another folder.

    Args:
        input_folder (str): Path to input images.
        output_folder (str): Path to save brightened images.
        beta (int): Brightness value to add (0–100 recommended).
    """

    os.makedirs(output_folder, exist_ok=True)
    image_files = list(Path(input_folder).glob("*.[jp][pn]g"))

    for path in image_files:
        img = cv2.imread(str(path))
        if img is None:
            print(f"[Skipped] Could not read {path.name}")
            continue

        # Increase brightness by adding beta to all pixels
        bright = cv2.convertScaleAbs(img, alpha=1.0, beta=beta)

        out_path = os.path.join(output_folder, path.name)
        cv2.imwrite(out_path, bright)
        print(f"[Saved] {out_path}")

def remove_images_without_enough_black_pixels(folder_path="temp_ocr", black_threshold=50, min_black_pixel_count=10):
    """
    Scans a folder for images and removes any that don't contain enough
    pixels darker than the specified threshold.
    
    Args:
        folder_path: Path to the folder containing images
        black_threshold: Pixel intensity threshold (0-255) below which pixels are considered "black"
                         Lower values are darker. Default is 50.
        min_black_pixel_count: Minimum number of black pixels required to keep the image
    
    Returns:
        tuple: (number of images checked, number of images removed)
    """
    # Check if folder exists
    if not os.path.exists(folder_path):
        print(f"Folder {folder_path} not found.")
        return 0, 0
    
    # Get all image files in the folder
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
    image_files = []
    for ext in image_extensions:
        image_files.extend(Path(folder_path).glob(f"*{ext}"))
    
    if not image_files:
        print(f"No image files found in {folder_path}")
        return 0, 0
    
    removed_count = 0
    total_count = len(image_files)
    
    # Process each image
    for img_path in image_files:
        # Read the image
        image = cv2.imread(str(img_path))
        
        if image is None:
            print(f"Could not read {img_path}, skipping.")
            continue
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Count pixels darker than the threshold
        # Create a binary image where black pixels become white (255) and others become black (0)
        _, binary = cv2.threshold(gray, black_threshold, 255, cv2.THRESH_BINARY_INV)
        
        # Count the white pixels in the binary image (which were the dark pixels in the original)
        black_pixel_count = cv2.countNonZero(binary)
        
        # If there are fewer black pixels than the minimum, remove the image
        if black_pixel_count < min_black_pixel_count:
            # Too few black pixels found - remove the image
            os.remove(img_path)
            removed_count += 1
            # print(f"Removed {img_path} (black pixel count: {black_pixel_count})")
    
    # print(f"Checked {total_count} images, removed {removed_count} images with fewer than {min_black_pixel_count} black pixels.")
    return 

def crop_images_to_black_content(folder_path="temp_ocr", black_threshold=70, margin_size=7, padding=10):
    # """
    # Processes images in a folder by cropping from leftmost to rightmost black pixel.
    # Uses the same approach as the original cropping algorithm with added padding.
    
    # Args:
    #     folder_path: Path to the folder containing images
    #     black_threshold: Threshold for detecting black pixels (0-255)
    #     margin_size: Size of top/bottom margin to add to output images
    #     padding: Extra padding to include on either side of black content
        
    # Returns:
    #     int: Number of images processed
    # """
    # # Check if folder exists
    # if not os.path.exists(folder_path):
    #     print(f"Folder {folder_path} not found.")
    #     return 0
    
    # # Get all image files in the folder
    # image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
    # image_files = []
    # for ext in image_extensions:
    #     image_files.extend(Path(folder_path).glob(f"*{ext}"))
    
    # if not image_files:
    #     print(f"No image files found in {folder_path}")
    #     return 0
    
    # processed_count = 0
    
    # # Process each image
    # for img_path in image_files:
    #     try:
    #         # Read the image
    #         image = cv2.imread(str(img_path))
            
    #         if image is None:
    #             print(f"Could not read {img_path}, skipping.")
    #             continue
            
    #         # Get original dimensions
    #         height, width = image.shape[:2]
            
    #         # Convert to grayscale
    #         gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
    #         # Apply threshold to create binary image
    #         _, binary_image = cv2.threshold(gray_image, black_threshold, 255, cv2.THRESH_BINARY_INV)
            
    #         # Find coordinates of black pixels (non-zero in binary image)
    #         non_zero_coords = np.column_stack(np.where(binary_image > 0))
            
    #         # If no black pixels found, skip further processing
    #         if non_zero_coords.size > 0:
    #             # Get column coordinates (x-coordinates) of black pixels
    #             # In np.where [0] is rows (y) and [1] is columns (x)
    #             # Here we need to look at [1] indices for horizontal (x) coordinates
    #             leftmost_black = non_zero_coords[:, 1].min()
    #             rightmost_black = non_zero_coords[:, 1].max()
                
    #             # Calculate crop boundaries with added padding
    #             left_crop = max(leftmost_black - padding, 0)
    #             right_crop = min(rightmost_black + padding, width)
                
    #             # Crop the image horizontally
    #             cropped = image[:, left_crop:right_crop]
                
    #             # Add top and bottom margins
    #             cropped_height, cropped_width = cropped.shape[:2]
                
    #             # Create new white image with margins
    #             result = np.ones((cropped_height + 2 * margin_size, cropped_width, 3), dtype=np.uint8) * 255
                
    #             # Place the cropped image in the center with margins
    #             result[margin_size:margin_size + cropped_height, :] = cropped
                
    #             # Save the resulting image, overwriting the original
    #             cv2.imwrite(str(img_path), result)
                
    #             processed_count += 1
    #             print(f"Processed {img_path} - cropped from x={left_crop} to x={right_crop}, added {margin_size}px margins")
    #         else:
    #             print(f"No black pixels found in {img_path}, skipping.")
                
    #     except Exception as e:
    #         print(f"Error processing {img_path}: {e}")
    
    # print(f"Successfully processed {processed_count} out of {len(image_files)} images.")
    return 
 
def enhance_images_for_paddleocr(folder_path="temp_ocr/merged_line"):
    """
    Enhance images to improve text clarity for PaddleOCR without losing content.

    - Upscales resolution (4x)
    - Applies CLAHE contrast enhancement
    - Optional denoise/sharpen
    - No binary thresholding (preserves detail)

    Args:
        folder_path: Folder with images to enhance (in-place)
    """
    if not os.path.exists(folder_path):
        print(f"Folder {folder_path} not found.")
        return 0

    image_files = []
    for ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
        image_files.extend(Path(folder_path).glob(f"*{ext}"))

    if not image_files:
        print(f"No image files found in {folder_path}")
        return 0

    processed = 0

    for img_path in image_files:
        try:
            image = cv2.imread(str(img_path))
            if image is None:
                print(f"[Skipped] Cannot read {img_path.name}")
                continue

            # Step 1: Upscale for better OCR
            image = cv2.resize(image, None, fx=4.0, fy=4.0, interpolation=cv2.INTER_CUBIC)

            # Step 2: Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Step 3: Apply CLAHE for local contrast
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)

            # Step 4 (optional): sharpen
            sharpen_kernel = np.array([[0, -1, 0],
                                       [-1, 5, -1],
                                       [0, -1, 0]])
            sharpened = cv2.filter2D(enhanced, -1, sharpen_kernel)

            # Step 5: convert back to BGR (PaddleOCR works better with 3-channel)
            final = cv2.cvtColor(sharpened, cv2.COLOR_GRAY2BGR)

            cv2.imwrite(str(img_path), final)
            processed += 1

        except Exception as e:
            print(f"[Error] Processing {img_path.name}: {e}")

    print(f"[Done] Enhanced {processed} images for PaddleOCR.")
    return processed

def convert_char(text_list):
    """
    Convert characters in OCR results to improve numeric recognition.
    
    Args:
        text_list: List of OCR result texts
        
    Returns:
        Processed text list with mapped characters
    """
    # Character mapping for common OCR misrecognitions
    mapping = {
        'A': '4', 'B': '8', 'm': '3', 'G': '6', 'I': '1', 'O': '0', 
        'S': '5', 's': '5', 'T': '7', 'Z': '2', 'l': '1', 'M': '3', 'g': '9', 
        ',': '.', '+': '7', '-': '', 'D': '', '/': '1', '|': '1', '\\': '1'
    }
    
    if not text_list:
        return []
        
    # Process each string in the list
    processed_list = []
    for text in text_list:
        processed_text = ''.join(mapping.get(char, char) for char in text)
        processed_list.append(processed_text)
    
    return processed_list

def perform_ocr(img_path, font_path='south-park.ttf', output_dir='temp_ocr/detected'):
    """
    Perform OCR on an image and save visualization of results.
    
    Args:
        img_path: Path to the input image
        font_path: Path to font for visualization (optional)
        output_dir: Directory to save visualization output
        
    Returns:
        List of OCR text results
    """
    # Check if image exists
    if not os.path.exists(img_path):
        print(f"Warning: Image not found: {img_path}")
        return []
        
    # Initialize OCR
    try:
        ocr = PaddleOCR(
            lang='en',
            use_angle_cls=True,          # Detect text at different angles
            rec_algorithm='SVTR_LCNet',  # More advanced recognition algorithm
            det_algorithm='DB',          # Enhanced detection algorithm
            det_db_thresh=0.2,           # Lower threshold for better detection of faint text
            det_db_box_thresh=0.25,      # Lower box threshold for detecting unclear boundaries
            det_db_unclip_ratio=2.0,     # Higher ratio to better group characters in handwriting
            use_dilation=True,           # Help connect broken character strokes
            use_gpu=True,                # Use GPU if available for better performance
            enable_mkldnn=True,          # Enable Intel acceleration if available
            rec_batch_num=6,             # Increased batch size for recognition
            max_batch_size=12,           # Higher batch size for processing
            drop_score=0.4,              # Lower confidence threshold to catch more potential text
            det_limit_side_len=960       # Higher resolution limit for better detail capture
        )
        result = ocr.ocr(img_path, cls=False)
    except Exception as e:
        print(f"OCR error for {img_path}: {e}")
        return []

    # Check if OCR found any text
    if not result or not result[0]:
        print(f"No text found in {img_path}")
        return []
    

    # Extract OCR results
    try:
        image = Image.open(img_path).convert('RGB')
        boxes = [line[0] for line in result[0]]
        txts = [line[1][0] for line in result[0]]
        scores = [line[1][1] for line in result[0]]

        # Save visualization if font is provided
        os.makedirs(output_dir, exist_ok=True)
        im_show = draw_ocr(image, boxes, txts, scores, font_path=font_path)
        im_show = Image.fromarray(im_show)
        base_filename = os.path.splitext(os.path.basename(img_path))[0]
        output_path = os.path.join(output_dir, f'result_{base_filename}.jpg')
        im_show.save(output_path)
    except Exception as e:
        print(f"Error saving OCR visualization for {img_path}: {e}")
        return txts if 'txts' in locals() else []

    return txts
 
def parse(data):
    """
    Clean and convert OCR raw output into decimal-formatted values.

    Rules:
    - Remove ',' and '.' from each item
    - Keep only items that contain at least one digit
    - Drop empty strings and items with no numbers
    - If more than 2 digits → take last 2 and insert '.' between
    - If only 1 digit → return 'X.0'
    - Drop sublists with fewer than 2 items after cleaning
    """
    result = []

    for sublist in data:
        if not sublist:
            continue

        processed = []

        for item in sublist:
            if not item:
                continue

            # Remove unwanted characters
            item = item.replace(",", "").replace(".", "")

            # Skip if no digits at all
            if not re.search(r'\d', item):
                continue

            # Extract only the last 2 characters that include digits
            digits = ''.join(re.findall(r'\d', item))
            if len(digits) > 2  and digits[-1] == '1':
                formatted = f"{digits[-3]}.{digits[-2]}"
            elif len(digits) > 2  and digits[-1] == '0':
                formatted = f"{digits[-3]}.{digits[-2]}"
            elif len(digits) >= 2 and digits[-1] in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] and digits[-2] in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']:
                formatted = f"{digits[-2]}.{digits[-1]}"
            # elif len(digits) == 1:
            #     formatted = f"{digits[-1]}.0"
            elif digits == '0' or digits[-1] not in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']:
                continue
            else:
                continue

            print(f"from: {digits}, to: {formatted}")

            processed.append(formatted)

        # Keep sublist only if at least 2 items remain
        if len(processed) > 1:
            result.append(processed)

    return result

def parse_and_merge(arr):
    """
    Parse and merge processed OCR data, including the first array.
    
    Args:
        arr: Processed OCR data
        
    Returns:
        length: Always None since we're keeping all data
        text: Merged list of OCR texts including all arrays
    """
    # Handle empty input
    if not arr:
        return None, []
    
    # Merge all text items from all rows
    text = []
    try:
        for sublist in arr:  # 
            text.extend(sublist)
    except Exception as e:
        print(f"Error merging OCR data: {e}")
    
    return None, text

def ocr_pipeline(image_path, output_base=None, temp_dir=None):
    """
    Complete OCR pipeline: extract red box, process into lines, and perform OCR.
    
    Args:
        image_path: Path to the input image
        output_base: Base directory for output files
        temp_dir: Directory for temporary files
        
    Returns:
        Dictionary of OCR results by file
    """
    # Set default output directory
    if output_base is None:
        output_base = f'temp_ocr/{Path(image_path).stem}'
    
    all_texts = {}
    
    try:

        corners = detect_red_box_corners(image_path)
        extract_by_corners(image_path, corners)
        extract_rows()
        remove_images_without_enough_black_pixels('temp_ocr/rows')
        extract_cell()
        remove_images_without_enough_black_pixels('temp_ocr/cells')
        upscale_image()
        add_padding()
        merge_line()
        remove_images_without_enough_black_pixels('temp_ocr/merged_line')
        # enhance_images_for_paddleocr('temp_ocr/merged_line')
        # increase_brightness()
        
        # Perform OCR on each line
        all_texts = {}
        temp_ocr_folder = Path("temp_ocr/merged_line")
        pattern = re.compile(r"^line_merged_\d{2}\.jpg$")

        for file_path in sorted(temp_ocr_folder.glob("*.jpg")):
            if not pattern.match(file_path.name):
                continue  # Skip files not matching 'final_rXX.jpg'

            try:
                file_path_str = str(file_path)
                texts = perform_ocr(file_path_str)
                # print(f"text: {texts}")
                all_texts[file_path_str] = convert_char(texts)
            except Exception as e:
                print(f"Error processing {file_path.name}: {e}")
    except Exception as e:
            print(f"Error: {e}")
    # print(all_texts)
    return all_texts
                
def write_to_json(arr, filename='result.json'):
    """
    Write OCR results to a JSON file.
    
    Args:
        arr: Array of OCR results
        filename: Output JSON filename
        
    Returns:
        None
    """
    try:
        # Create numbered dictionary from array
        data = {str(i + 1): value for i, value in enumerate(arr)}
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filename) or '.', exist_ok=True)
        
        # Write to JSON file
        with open(filename, 'w') as file:
            json.dump(data, file, indent=4)
            
        print(f"Results written to {filename}")
    except Exception as e:
        print(f"Error writing JSON: {e}")



