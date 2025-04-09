import cv2
import numpy as np
import os
import cv2
import math
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from tqdm import tqdm
def compute_green_percentage(image_bgr, lower_green=(35, 50, 50), upper_green=(85, 255, 255)):
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    green_mask = cv2.inRange(hsv, np.array(lower_green), np.array(upper_green))
    green_pixels = cv2.countNonZero(green_mask)
    total_pixels = image_bgr.shape[0] * image_bgr.shape[1]
    return (green_pixels / total_pixels) * 100

def image_with_highest_green_percentage(folder_path, lower_green=(35, 50, 50), upper_green=(85, 255, 255)):
    valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'}
    best_file = None
    best_green_percentage = 0.0
    for filename in os.listdir(folder_path):
        name, ext = os.path.splitext(filename)
        if ext.lower() in valid_extensions:
            file_path = os.path.join(folder_path, filename)
            image = cv2.imread(file_path)
            if image is None:
                continue
            perc = compute_green_percentage(image, lower_green, upper_green)
            if perc > best_green_percentage:
                best_green_percentage = perc
                best_file = filename
    return best_file, best_green_percentage

def convert_white_to_transparent(input_path, output_path, threshold=240):
    try:
        img = Image.open(input_path)
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        data = np.array(img)
        r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
        mask = (r > threshold) & (g > threshold) & (b > threshold)
        data[:,:,3] = np.where(mask, 0, a)
        result = Image.fromarray(data)
        result.save(output_path, "PNG")
        return result
    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        return None

def measure_longest_side(img):
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    data = np.array(img)
    alpha = data[:,:,3]
    mask = alpha > 0
    coords = np.argwhere(mask)
    if coords.size == 0:
        return 0, None, None
    points = np.flip(coords, axis=1)  # (col, row) -> (x, y)
    points_cv = points.astype(np.int32).reshape(-1, 1, 2)
    hull = cv2.convexHull(points_cv)
    if len(hull) < 2:
        return 0, None, None
    max_dist = 0
    pt1 = pt2 = None
    for i in range(len(hull)):
        for j in range(i + 1, len(hull)):
            p1 = tuple(hull[i][0])
            p2 = tuple(hull[j][0])
            d = math.hypot(p1[0] - p2[0], p1[1] - p2[1])
            if d > max_dist:
                max_dist = d
                pt1 = p1
                pt2 = p2
    return max_dist, pt1, pt2

def extract_marker_properties(folder_path, marker_physical_cm=28.0,
                              lower_green=(35, 50, 50), upper_green=(85, 255, 255),
                              white_threshold=240):
    marker_filename, green_pct = image_with_highest_green_percentage(folder_path,
                                                                     lower_green,
                                                                     upper_green)
    if marker_filename is None:
        raise ValueError("No marker image found based on green detection.")
    
    marker_path = os.path.join(folder_path, marker_filename)
    
    # 2. Process the marker image: convert white background to transparency.
    marker_img = convert_white_to_transparent(marker_path, marker_path, threshold=white_threshold)
    if marker_img is None:
        raise ValueError(f"Failed to process marker image: {marker_filename}")
    
    # 3. Measure the longest side (in pixels) of the processed marker image.
    longest_side_px, pt1, pt2 = measure_longest_side(marker_img)
    if longest_side_px == 0 or pt1 is None or pt2 is None:
        raise ValueError("Could not measure the longest side in the marker image.")
    
    # 4. Compute the conversion factor: how many centimeters per pixel.
    conversion_factor = marker_physical_cm / longest_side_px

    return marker_filename, longest_side_px, conversion_factor


# Example usage:
if __name__ == "__main__":
    folder = "frag-temp"  # Replace with your folder path as needed.
    try:
        marker_file, longest_px, cm_per_px = extract_marker_properties(folder)
        print(f"Marker image: {marker_file}")
        print(f"Longest side: {longest_px:.2f} pixels")
        print(f"1 px represents: {cm_per_px:.4f} cm")
    except Exception as e:
        print("Error:", e)
