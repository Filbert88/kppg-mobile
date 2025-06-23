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
import logging

logging.getLogger().setLevel(logging.ERROR)
logging.getLogger("ppocr").setLevel(logging.ERROR)
logging.getLogger("PIL").setLevel(logging.ERROR)

os.environ["FLAGS_log_level"] = "3"
os.environ["PPLOGGER_LEVEL"] = "ERROR"

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
            x2 = min(w, int(round(cx_float_end)) + 2)

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

        # Split into chunks of cells_per_row
        row_chunks = [resized_images[i:i + cells_per_row] for i in range(0, len(resized_images), cells_per_row)]
        merged_rows = []

        for i, row_imgs in enumerate(row_chunks):
            h = target_height
            # For rows except the last, pad/stretch as before
            if i != len(row_chunks) - 1 or len(row_imgs) == cells_per_row:
                row_imgs = [cv2.resize(img, (img.shape[1], h)) for img in row_imgs]
                row_merged = cv2.hconcat(row_imgs).astype(np.uint8)
            else:
                # For the last row: do NOT stretch, pad with white if needed
                widths = [img.shape[1] for img in row_imgs]
                row_width = sum(widths)
                target_width = max(sum([img.shape[1] for img in chunk]) for chunk in row_chunks)
                # Create white background
                row_merged = np.ones((h, target_width, 3), dtype=np.uint8) * 255
                x = 0
                for img in row_imgs:
                    w = img.shape[1]
                    row_merged[:, x:x+w] = img
                    x += w
            merged_rows.append(row_merged)

        # Ensure all rows have the same width for vconcat
        target_width = max(row.shape[1] for row in merged_rows)
        padded_rows = []
        for row_img in merged_rows:
            h, w, c = row_img.shape
            if w < target_width:
                pad = np.ones((h, target_width - w, 3), dtype=np.uint8) * 255
                row_img = np.concatenate([row_img, pad], axis=1)
            padded_rows.append(row_img)

        final_img = cv2.vconcat(padded_rows)

        out_path = os.path.join(output_folder, f"line_merged_{row}.jpg")
        cv2.imwrite(out_path, final_img)
        shutil.copy(out_path, os.path.join(debug_folder, f"final_r{row}.jpg"))

def clean_image(input_folder='temp_ocr/merged_line', output_folder='temp_ocr/cleaned'):
    os.makedirs(output_folder, exist_ok=True)
    # Supported image file extensions
    exts = ('.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff')

    for filename in os.listdir(input_folder):
        if not filename.lower().endswith(exts):
            continue
        input_path = os.path.join(input_folder, filename)
        img = cv2.imread(input_path)
        if img is None:
            continue
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, solid = cv2.threshold(gray, 70, 255, cv2.THRESH_BINARY_INV)
        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(solid, connectivity=8)
        min_area = 4000
        mask = np.zeros_like(solid)
        for i in range(1, num_labels):
            if stats[i, cv2.CC_STAT_AREA] > min_area:
                mask[labels == i] = 255
        result = cv2.bitwise_not(mask)

        # Prepare output filename
        base, ext = os.path.splitext(filename)
        out_path = os.path.join(output_folder, f"clean_{base}{ext}")
        cv2.imwrite(out_path, result)

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
    return 

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
        '||': '', 'PM': '', '1 1': '', '| |': '', 'A': '4', 'B': '8', 'm': '3', 'G': '6', 'I': '1', 'O': '0', 
        'S': '5', 's': '5', 'T': '7', 'Z': '2', 'l': '1', 'M': '3', 'g': '9', 
        ',': '.', '+': '7', '-': '', 'D': '', '/': '1', '|': '1'
    }
    
    if not text_list:
        return []
        
    # Process each string in the list
    processed_list = []
    for text in text_list:
        text = re.sub(r'pm', '', text, flags=re.IGNORECASE)
        processed_text = ''.join(mapping.get(char, char) for char in text)
        processed_list.append(processed_text)
    
    return processed_list
 
def sort_ocr_boxes(boxes, txts, scores, y_thresh=20):
    """
    boxes: list of 4-point polygons (from PaddleOCR)
    txts, scores: parallel lists
    y_thresh: vertical tolerance to cluster into rows (in pixels)
    Returns: lists sorted as desired
    """
    # Get each box’s center y,x for sorting
    centers = [np.mean(box, axis=0) for box in boxes]
    centers = np.array(centers)
    ys = centers[:, 1]
    xs = centers[:, 0]

    # Cluster into rows: assign row_idx for each box
    row_indices = []
    current_row = 0
    sorted_y = np.argsort(ys)
    last_y = None
    for i in sorted_y:
        if last_y is None or abs(ys[i] - last_y) > y_thresh:
            current_row += 1
        row_indices.append((current_row, i))
        last_y = ys[i]

    # Group boxes by row
    row_groups = {}
    for row, idx in row_indices:
        row_groups.setdefault(row, []).append(idx)

    # Sort each row left-to-right
    sorted_indices = []
    for row in sorted(row_groups.keys()):
        row_idxs = row_groups[row]
        # Sort row by x
        row_sorted = sorted(row_idxs, key=lambda idx: xs[idx])
        sorted_indices.extend(row_sorted)

    # Apply sorted order
    sorted_boxes = [boxes[i] for i in sorted_indices]
    sorted_txts = [txts[i] for i in sorted_indices]
    sorted_scores = [scores[i] for i in sorted_indices]
    return sorted_boxes, sorted_txts, sorted_scores

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
            det_db_thresh=0.01,           # Lower threshold for better detection of faint text
            det_db_box_thresh=0.05,      # Lower box threshold for detecting unclear boundaries
            det_db_unclip_ratio=2.0,     # Higher ratio to better group characters in handwriting
            use_dilation=True,           # Help connect broken character strokes
            use_gpu=True,                # Use GPU if available for better performance
            enable_mkldnn=True,          # Enable Intel acceleration if available
            rec_batch_num=3,             # Increased batch size for recognition
            max_batch_size=6,           # Higher batch size for processing
            drop_score=0.00,              # Lower confidence threshold to catch more potential text
            det_limit_side_len=1920,       # Higher resolution limit for better detail capture
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

        boxes, txts, scores = sort_ocr_boxes(boxes, txts, scores, y_thresh=20)

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
            
            # Exclude if contains 'PM' (case-insensitive)
            if 'pm' in item.lower():
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
        clean_image()
        remove_images_without_enough_black_pixels('temp_ocr/merged_line')
        
        # Perform OCR on each line
        all_texts = {}
        temp_ocr_folder = Path("temp_ocr/cleaned")
        # pattern = re.compile(r"^cleaned_\d{2}\.jpg$")
        debug = {}

        for file_path in sorted(temp_ocr_folder.glob("*.jpg")):
            # if not pattern.match(file_path.name):
            #     continue  # Skip files not matching 'final_rXX.jpg'

            try:
                file_path_str = str(file_path)
                texts = perform_ocr(file_path_str)
                debug[file_path_str] = texts
                all_texts[file_path_str] = convert_char(texts)
            except Exception as e:
                print(f"Error processing {file_path.name}: {e}")
    except Exception as e:
            print(f"Error: {e}")
    print(f"Debug info: {debug}")        
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



