import os
import cv2
import numpy as np
from PIL import Image
import json
from pathlib import Path

from paddleocr import PaddleOCR, draw_ocr
# https://github.com/PaddlePaddle/PaddleOCR.git

  
def extract_red_box(image_path, output_dir='temp_ocr/red_box'):
    """
    Extract and straighten the red/orange box from an image with improved detection.
    
    Args:
        image_path: Path to the input image
        output_dir: Directory to save the extracted box
        
    Returns:
        Path to the extracted and straightened red box image
    """
    # Check if image exists
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
        
    # Read the image
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not read image from {image_path}")
    
    # Create a copy of original image
    orig_image = image.copy()
    
    # Try multiple detection methods
    contours = None
    
    # Method 1: Enhanced HSV color detection for orange-red
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # Much broader range for red/orange detection
    lower_red1 = np.array([0, 40, 60])  
    upper_red1 = np.array([20, 255, 255])  
    lower_red2 = np.array([150, 40, 60])   
    upper_red2 = np.array([180, 255, 255]) 
    
    # Create masks
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    mask = cv2.bitwise_or(mask1, mask2)
    
    # Apply morphology to enhance detection
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_DILATE, kernel)
    
    # Find contours in the mask
    contours_color, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours_color and len(contours_color) > 0:
        # Filter contours by size and shape (looking for a large rectangular contour)
        valid_contours = []
        for cnt in contours_color:
            area = cv2.contourArea(cnt)
            if area > 10000:  # Minimum area threshold
                # Check if it's rectangular
                peri = cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
                if len(approx) >= 4:  # At least 4 corners
                    valid_contours.append(cnt)
        
        if valid_contours:
            contours = valid_contours
    
    # Method 2: Try edge detection if color detection failed
    if not contours or len(contours) == 0:
        print("Color detection failed, trying edge detection...")
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 30, 150)
        
        # Enhance edges
        kernel = np.ones((5, 5), np.uint8)
        edges = cv2.dilate(edges, kernel, iterations=1)
        
        contours_edges, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter for large rectangular contours
        valid_contours = []
        for cnt in contours_edges:
            area = cv2.contourArea(cnt)
            if area > 10000:  # Minimum area threshold
                # Check if it's rectangular
                peri = cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
                if len(approx) >= 4:  # At least 4 corners
                    valid_contours.append(cnt)
        
        if valid_contours:
            contours = valid_contours
    
    # Method 3: Try direct rectangle detection
    if not contours or len(contours) == 0:
        print("Edge detection failed, trying direct rectangle detection...")
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                      cv2.THRESH_BINARY_INV, 11, 2)
        # Find contours in binary image
        contours_rect, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        
        # Look for the largest roughly rectangular contour
        max_area = 0
        largest_rect_contour = None
        
        for cnt in contours_rect:
            area = cv2.contourArea(cnt)
            if area > max_area and area > 10000:
                peri = cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
                if len(approx) >= 4 and len(approx) <= 8:  # Approximately rectangular
                    max_area = area
                    largest_rect_contour = cnt
        
        if largest_rect_contour is not None:
            contours = [largest_rect_contour]
    
    # Find the largest contour, which is likely our red box
    if contours and len(contours) > 0:
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Approximate the contour to a polygon
        epsilon = 0.02 * cv2.arcLength(largest_contour, True)
        approx = cv2.approxPolyDP(largest_contour, epsilon, True)
        
        # If we have a quadrilateral (or can approximate as one)
        if len(approx) >= 4:
            # If more than 4 points, find the 4 extreme corners
            if len(approx) > 4:
                # Find bounding rectangle
                rect = cv2.minAreaRect(approx)
                box = cv2.boxPoints(rect)
                corners = np.int0(box)
            else:
                corners = approx.reshape(4, 2)
            
            # Sort corners to ensure they are in the order: top-left, top-right, bottom-right, bottom-left
            corners = order_points(corners)
            
            # Get width and height of the box
            width = max(
                np.linalg.norm(corners[0] - corners[1]),
                np.linalg.norm(corners[2] - corners[3])
            )
            height = max(
                np.linalg.norm(corners[0] - corners[3]),
                np.linalg.norm(corners[1] - corners[2])
            )
            width, height = int(width), int(height)
            
            # Define destination points for perspective transform
            dst_points = np.array([
                [0, 0],
                [width, 0],
                [width, height],
                [0, height]
            ], dtype=np.float32)
            
            # Perform perspective transform
            matrix = cv2.getPerspectiveTransform(corners.astype(np.float32), dst_points)
            warped = cv2.warpPerspective(orig_image, matrix, (width, height))
            
            # Create output directory if it doesn't exist
            os.makedirs(output_dir, exist_ok=True)
            
            # Get the filename from the path
            filename = Path(image_path).stem
            output_path = os.path.join(output_dir, f"{filename}_red_box.jpg")
            
            # Save the warped image
            cv2.imwrite(output_path, warped)
            
            print(f"Box extracted and saved to {output_path}")
            return output_path, warped
    
    # If all detection methods fail, use a fallback method - detect the largest rectangular area
    print("All detection methods failed, using fallback method...")
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Find external contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours:
        # Sort contours by area (largest first)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        
        # Try to find a rectangular contour
        for contour in contours[:5]:  # Check the 5 largest contours
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.04 * peri, True)
            
            if len(approx) >= 4:  # At least 4 corners
                # Create a refined rectangle from this approximation
                rect = cv2.minAreaRect(approx)
                box = cv2.boxPoints(rect)
                corners = np.int0(box)
                
                # Sort corners
                corners = order_points(corners)
                
                # Get width and height of the box
                width = max(
                    np.linalg.norm(corners[0] - corners[1]),
                    np.linalg.norm(corners[2] - corners[3])
                )
                height = max(
                    np.linalg.norm(corners[0] - corners[3]),
                    np.linalg.norm(corners[1] - corners[2])
                )
                width, height = int(width), int(height)
                
                # Check if dimensions make sense for a form
                if width > 100 and height > 100:
                    # Define destination points for perspective transform
                    dst_points = np.array([
                        [0, 0],
                        [width, 0],
                        [width, height],
                        [0, height]
                    ], dtype=np.float32)
                    
                    # Perform perspective transform
                    matrix = cv2.getPerspectiveTransform(corners.astype(np.float32), dst_points)
                    warped = cv2.warpPerspective(orig_image, matrix, (width, height))
                    
                    # Create output directory if it doesn't exist
                    os.makedirs(output_dir, exist_ok=True)
                    
                    # Get the filename from the path
                    filename = Path(image_path).stem
                    output_path = os.path.join(output_dir, f"{filename}_red_box.jpg")
                    
                    # Save the warped image
                    cv2.imwrite(output_path, warped)
                    
                    print(f"Box extracted with fallback method and saved to {output_path}")
                    return output_path, warped
    
    raise ValueError("Could not detect a box in the image using any method")

def order_points(pts):
    """
    Order points in the order: top-left, top-right, bottom-right, bottom-left
    
    Args:
        pts: Array of 4 points
        
    Returns:
        Ordered points array
    """
    # Initialize ordered points array
    rect = np.zeros((4, 2), dtype=np.float32)
    
    # Sum of coordinates: top-left will have smallest sum, bottom-right will have largest sum
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # Top-left
    rect[2] = pts[np.argmax(s)]  # Bottom-right
    
    # Difference between coordinates: top-right will have smallest difference, bottom-left will have largest
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # Top-right
    rect[3] = pts[np.argmax(diff)]  # Bottom-left
    
    return rect

def process_image(img_path, output_base="temp_ocr"):
    """
    Process an image by dividing it into 30 EXACTLY EQUAL lines.
    No margins or padding. Every row has precisely the same height.
    
    Args:
        img_path: Path to the input image file
        output_base: Base directory to save the output segments
        
    Returns:
        list: Paths to the saved line files
    """
    # Create output directory
    os.makedirs(output_base, exist_ok=True)
    
    # Read the image from path
    image = cv2.imread(img_path)
    if image is None:
        raise ValueError(f"Could not read image from {img_path}")
    
    # Get image dimensions
    height, width = image.shape[:2]
    
    # Calculate EXACT line height - use float division first, then round
    # We want all rows to be IDENTICAL in height
    exact_line_height = height / 30
    
    output_files = []
    
    # Process each line
    for i in range(30):
        # Calculate line boundaries using floating point and then convert to int
        # This ensures the cuts are as equal as possible
        y_start = int(i * exact_line_height)
        y_end = int((i + 1) * exact_line_height)
        
        # Extract the line
        line_img = image[y_start:y_end, 0:width].copy()
        
        # Save line WITHOUT any margin
        filename = f"line_{i+1}.jpg"
        output_path = os.path.join(output_base, filename)
        cv2.imwrite(output_path, line_img)
        output_files.append(output_path)
    
    return output_files

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
            print(f"Removed {img_path} (black pixel count: {black_pixel_count})")
    
    print(f"Checked {total_count} images, removed {removed_count} images with fewer than {min_black_pixel_count} black pixels.")
    return 

def crop_images_to_black_content(folder_path="temp_ocr", black_threshold=70, margin_size=7, padding=10):
    """
    Processes images in a folder by cropping from leftmost to rightmost black pixel.
    Uses the same approach as the original cropping algorithm with added padding.
    
    Args:
        folder_path: Path to the folder containing images
        black_threshold: Threshold for detecting black pixels (0-255)
        margin_size: Size of top/bottom margin to add to output images
        padding: Extra padding to include on either side of black content
        
    Returns:
        int: Number of images processed
    """
    # Check if folder exists
    if not os.path.exists(folder_path):
        print(f"Folder {folder_path} not found.")
        return 0
    
    # Get all image files in the folder
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
    image_files = []
    for ext in image_extensions:
        image_files.extend(Path(folder_path).glob(f"*{ext}"))
    
    if not image_files:
        print(f"No image files found in {folder_path}")
        return 0
    
    processed_count = 0
    
    # Process each image
    for img_path in image_files:
        try:
            # Read the image
            image = cv2.imread(str(img_path))
            
            if image is None:
                print(f"Could not read {img_path}, skipping.")
                continue
            
            # Get original dimensions
            height, width = image.shape[:2]
            
            # Convert to grayscale
            gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply threshold to create binary image
            _, binary_image = cv2.threshold(gray_image, black_threshold, 255, cv2.THRESH_BINARY_INV)
            
            # Find coordinates of black pixels (non-zero in binary image)
            non_zero_coords = np.column_stack(np.where(binary_image > 0))
            
            # If no black pixels found, skip further processing
            if non_zero_coords.size > 0:
                # Get column coordinates (x-coordinates) of black pixels
                # In np.where [0] is rows (y) and [1] is columns (x)
                # Here we need to look at [1] indices for horizontal (x) coordinates
                leftmost_black = non_zero_coords[:, 1].min()
                rightmost_black = non_zero_coords[:, 1].max()
                
                # Calculate crop boundaries with added padding
                left_crop = max(leftmost_black - padding, 0)
                right_crop = min(rightmost_black + padding, width)
                
                # Crop the image horizontally
                cropped = image[:, left_crop:right_crop]
                
                # Add top and bottom margins
                cropped_height, cropped_width = cropped.shape[:2]
                
                # Create new white image with margins
                result = np.ones((cropped_height + 2 * margin_size, cropped_width, 3), dtype=np.uint8) * 255
                
                # Place the cropped image in the center with margins
                result[margin_size:margin_size + cropped_height, :] = cropped
                
                # Save the resulting image, overwriting the original
                cv2.imwrite(str(img_path), result)
                
                processed_count += 1
                print(f"Processed {img_path} - cropped from x={left_crop} to x={right_crop}, added {margin_size}px margins")
            else:
                print(f"No black pixels found in {img_path}, skipping.")
                
        except Exception as e:
            print(f"Error processing {img_path}: {e}")
    
    print(f"Successfully processed {processed_count} out of {len(image_files)} images.")
    return 

def enhance_images_for_paddleocr(folder_path="temp_ocr"):
    """
    Enhance all images in a folder to optimize for PaddleOCR SVTR_LCNet recognition 
    and replace the original files.
    
    Args:
        folder_path: Path to folder containing images (default: "temp_ocr")
        
    Returns:
        int: Number of processed images
    """
    import cv2
    import numpy as np
    import os
    from pathlib import Path
    
    # Check if folder exists
    if not os.path.exists(folder_path):
        print(f"Folder {folder_path} not found.")
        return 0
    
    # Get all image files in the folder
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
    image_files = []
    for ext in image_extensions:
        image_files.extend(Path(folder_path).glob(f"*{ext}"))
    
    if not image_files:
        print(f"No image files found in {folder_path}")
        return 0
    
    processed_count = 0
    
    # Process each image
    for img_path in image_files:
        try:
            # Read the image
            img_path_str = str(img_path)
            image = cv2.imread(img_path_str)
            if image is None:
                print(f"Could not read image from {img_path}, skipping.")
                continue
            
            # Step 1: Increase resolution (higher resolution for SVTR_LCNet algorithm)
            scale_factor = 4.0  # Increased from 3.0 to 4.0
            image = cv2.resize(image, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_CUBIC)
            
            # Step 2: Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Step 3: Apply CLAHE to enhance local contrast (better for text detection)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            contrast_enhanced = clahe.apply(gray)
            
            # Step 4: Reduce noise while preserving edges using bilateral filter
            # This works better for the DB algorithm's edge detection
            filtered = cv2.bilateralFilter(contrast_enhanced, 11, 17, 17)
            
            # Step 5: Apply Otsu's thresholding to get binary image
            _, binary = cv2.threshold(filtered, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            
            # Step 6: Fill small holes and remove small noise
            kernel = np.ones((2, 2), np.uint8)
            morphed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            
            # Step 7: Dilate slightly to connect broken strokes (helps with det_db_unclip_ratio)
            dilated = cv2.dilate(morphed, kernel, iterations=1)
            
            # Step 8: Clean up grid lines that might interfere
            horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1))
            vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 25))
            horizontal_lines = cv2.morphologyEx(dilated, cv2.MORPH_OPEN, horizontal_kernel, iterations=1)
            vertical_lines = cv2.morphologyEx(dilated, cv2.MORPH_OPEN, vertical_kernel, iterations=1)
            grid_mask = cv2.bitwise_or(horizontal_lines, vertical_lines)
            cleaned = cv2.bitwise_and(dilated, cv2.bitwise_not(grid_mask))
            
            # Step 9: Smooth edges to help det_db_thresh parameter
            smoothed = cv2.GaussianBlur(cleaned, (3, 3), 0)
            _, smoothed_binary = cv2.threshold(smoothed, 127, 255, cv2.THRESH_BINARY)
            
            # Step 10: Invert back for PaddleOCR (which expects black text on white background)
            final = cv2.bitwise_not(smoothed_binary)
            
            # Save the enhanced image, replacing the original
            cv2.imwrite(img_path_str, final)
            processed_count += 1
            print(f"Enhanced and replaced: {img_path}")
            
        except Exception as e:
            print(f"Error enhancing {img_path}: {e}")
    
    print(f"Enhanced and replaced {processed_count} out of {len(image_files)} images")
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
        'A': '4', 'B': '8', 'm': '3', 'G': '6', 'I': '1', 'O': '0', 
        'S': '5', 'T': '7', 'Z': '2', 'l': '1', 'M': '3', 'g': '9', 
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

def parse(data):
    """
    Parse OCR data to extract numeric values.
    
    Args:
        data: List of OCR results
        
    Returns:
        Processed data with parsed numeric values
    """
    if not data:
        return []
        
    result = []
    # print("SUBLIST")
    for sublist in data:
        # print(sublist)
        if not sublist:
            continue
            
        processed_sublist = []
        for item in sublist:
            # Skip empty items
            if not item:
                processed_sublist.append([])
                continue
                
            temp = []
            buffer = ''
            
            # Split by 'x' character
            for char in item:
                if char.lower() == 'x':
                    if buffer:
                        temp.append(buffer)
                    buffer = ''
                else:
                    buffer += char
                    
            if buffer:
                temp.append(buffer)

            # Process numeric values and decimal points
            final_parts = []
            for part in temp:
                i = 0
                while i < len(part):
                    # Handle explicit decimal points (e.g., "1.5")
                    if i + 2 < len(part) and part[i+1] == '.':
                        final_parts.append(part[i:i+3])
                        i += 3
                    # Handle implied decimal points from OCR
                    elif i + 1 < len(part):
                        if i + 2 < len(part) and part[i+2] == '.':
                            final_parts.append(f"{part[i]}.0")
                            i += 1
                        else:
                            final_parts.append(f"{part[i]}.{part[i+1]}")
                            i += 2
                    else:
                        final_parts.append(part[i])
                        i += 1

            processed_sublist.append(final_parts)
            # print("proc: ", processed_sublist)
        result.append(processed_sublist)
        # print("res: ", result)
    
    return result
 
def perform_ocr(img_path, font_path=None, output_dir='sample_output'):
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
        if font_path and os.path.exists(font_path):
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
        for sublist in arr:  # Include all arrays, not just arr[1:]
            for item in sublist:
                text.extend(item)
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
        # Extract and straighten the red box
        input_processed_files, red_box_img = extract_red_box(image_path)
        
        # Process the extracted red box into lines
        processed_files = process_image(input_processed_files, output_base)

        # Remove unused image 
        remove_images_without_enough_black_pixels()
        crop_images_to_black_content()
        # enhance_images_for_paddleocr()
        
        # Perform OCR on each line
        all_texts = {}
        temp_ocr_folder = "temp_ocr"
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
        image_files = []
        for ext in image_extensions:
            image_files.extend(Path(temp_ocr_folder).glob(f"*{ext}"))

        for file_path in image_files:
            try:
                file_path_str = str(file_path)
                texts = perform_ocr(file_path_str)
                all_texts[file_path_str] = convert_char(texts)
            except Exception as e:
                print(f"Error: {e}")
    except Exception as e:
            print(f"Error: {e}")
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



