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
import io
from google.cloud import vision
from math import ceil, sqrt
import os
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures

load_dotenv()
endpoint = os.getenv("ENDPOINT")
key = os.getenv("KEY")

def ocr_Azure(input_path="temp_ocr/merged_line/all_cells_merged.jpg"):
    client = ImageAnalysisClient(endpoint=endpoint, credential=AzureKeyCredential(key))
    with open(input_path, "rb") as f:
        image_data = f.read()

    result = client.analyze(image_data=image_data, visual_features=[VisualFeatures.READ])

    output = []
    if result.read is not None and result.read.blocks:
        for block in result.read.blocks:
            for line in block.lines:
                output.append(line.text)
    else:
        print("  No text found in the image.")
    print(output)
    return output

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
        x_end = w - crop + 4
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

def upscale_image(folder_input='temp_ocr/cells', folder_output='temp_ocr/upscaled_cells', scale=6.0):

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
    os.makedirs(output_folder, exist_ok=True)
    debug_folder = os.path.join(output_folder, "debug")
    os.makedirs(debug_folder, exist_ok=True)

    # Clear debug folder
    for file in os.listdir(debug_folder):
        file_path = os.path.join(debug_folder, file)
        if os.path.isfile(file_path):
            os.unlink(file_path)

    images = []
    for file_path in sorted(Path(input_folder).glob("cell_*.jpg")):
        img = cv2.imread(str(file_path))
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
        print("[Skipped] No valid images found.")
        return

    total_images = len(images)
    cells_per_row = ceil(sqrt(total_images))

    # Resize to consistent height
    target_height = max(img.shape[0] for img in images)
    resized_images = [
        cv2.resize(img, (int(img.shape[1] * (target_height / img.shape[0])), target_height), interpolation=cv2.INTER_LINEAR)
        for img in images
    ]

    # Group into rows
    chunks = [resized_images[i:i + cells_per_row] for i in range(0, len(resized_images), cells_per_row)]
    row_images = []

    for chunk in chunks:
        if len(chunk) < cells_per_row:
            pad_width = max(img.shape[1] for img in chunk)
            white = np.ones((target_height, pad_width, 3), dtype=np.uint8) * 255
            while len(chunk) < cells_per_row:
                chunk.append(white.copy())
        row_img = cv2.hconcat(chunk)
        row_images.append(row_img)

    max_width = max(img.shape[1] for img in row_images)
    for i in range(len(row_images)):
        h, w, _ = row_images[i].shape
        if w < max_width:
            pad = np.ones((h, max_width - w, 3), dtype=np.uint8) * 255
            row_images[i] = np.concatenate([row_images[i], pad], axis=1)

    final_image = cv2.vconcat(row_images)
    output_path = os.path.join(output_folder, "all_cells_merged.jpg")
    cv2.imwrite(output_path, final_image)
    shutil.copy(output_path, os.path.join(debug_folder, "all_cells_merged_debug.jpg"))

def remove_images_without_enough_black_pixels(folder_path='temp_ocr/rows', black_threshold=50, min_black_pixel_count=1):

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

def convert_char(texts):
    mapping = {
        '||': '', 'PM': '', '1 1': '', '| |': '', 'A': '4', 'B': '8', 'm': '3', 'G': '6', 'I': '1', 'O': '0',
        'S': '5', 's': '5', 'Z': '2', 'l': '1', 'M': '3', 'g': '9',
        ',': '.', '+': '7', '-': '', 'D': '', '/': '1', '|': '1'
    }

    result = []
    for text in texts:
        for k in ['||', 'PM', '1 1', '| |']:
            if k in text:
                text = text.replace(k, mapping[k])
        prev = None
        while prev != text:
            prev = text
            for ch in [' ', 'x', 'X', '×']:
                text = text.replace(ch, '')
        converted = ''.join(mapping.get(c, c) for c in text)
        result.append(converted)
    return result


def parse(data):

    processed = []

    for item in data:
        if not item:
            continue

        if 'pm' in item.lower():
            continue

        item = item.replace(",", "").replace(".", "")

        if not re.search(r'\d', item):
            continue

        digits = ''.join(re.findall(r'\d', item))
        if len(digits) > 2  and digits[-1] == '1':
            formatted = f"{digits[-3]}.{digits[-2]}"
        elif len(digits) > 2  and digits[-1] == '0':
            formatted = f"{digits[-3]}.{digits[-2]}"
        elif len(digits) >= 2 and digits[-1] in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] and digits[-2] in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']:
            formatted = f"{digits[-2]}.{digits[-1]}"
        elif len(digits) == 1:
            formatted = f"{digits[-1]}"
        elif digits == '0' or digits[-1] not in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']:
            continue
        else:
            continue

        processed.append(formatted)

    return processed

def ocr_pipeline(image_path, output_base=None, temp_dir=None):

    if output_base is None:
        output_base = f'temp_ocr/{Path(image_path).stem}'
    
    texts = {}
    
    try:
        corners = detect_red_box_corners(image_path)
        extract_by_corners(image_path, corners)
        extract_rows()
        remove_images_without_enough_black_pixels()
        extract_cell()
        remove_images_without_enough_black_pixels('temp_ocr/cells')
        upscale_image()
        add_padding()
        merge_line()
        
        texts = ocr_Azure()
        texts = parse(texts)
        texts = convert_char(texts)

    except Exception as e:
            print(f"Error: {e}")
    
    return texts  
    
                
def write_to_json(arr, filename='result.json'):
    try:
        data = {str(i + 1): value for i, value in enumerate(arr)}
        os.makedirs(os.path.dirname(filename) or '.', exist_ok=True)

        with open(filename, 'w') as file:
            json.dump(data, file, indent=4)
            
        print(f"Results written to {filename}")
    except Exception as e:
        print(f"Error writing JSON: {e}")

