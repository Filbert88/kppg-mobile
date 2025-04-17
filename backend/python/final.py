import numpy as np
import matplotlib.pyplot as plt
import cv2
import os
import csv
def compute_kuz_ram_data(A, K, Q, E, n):
    X50 = A * Q**(0.17) * (115 / E)**(0.63) * K**(-0.8)
    Xc = X50 / (0.693)**(1/n)
    sizes = np.linspace(1, 3 * X50, 100)
    distribution = 100 * (1 - np.exp(- (sizes / Xc)**n))
    def get_percentile(percentile):
        indices = np.where(distribution >= percentile)[0]
        if len(indices) > 0:
            return sizes[indices[0]]
        return None
    P10 = get_percentile(10)
    P20 = get_percentile(20)
    P80 = get_percentile(80)
    P90 = get_percentile(90)
    below_60_idx = np.where(sizes <= 60)[0]
    if below_60_idx.size > 0:
        below_60 = below_60_idx[-1]
        percentage_below_60 = distribution[below_60]
    else:
        percentage_below_60 = 0.0
    percentage_above_60 = 100 - percentage_below_60
    return {
        "sizes": sizes,
        "distribution": distribution,
        "X50": X50,
        "P10": P10,
        "P20": P20,
        "P80": P80,
        "P90": P90,
        "percentage_below_60": percentage_below_60,
        "percentage_above_60": percentage_above_60
    }


def measure_longest_side_from_contour(contour):
    hull = cv2.convexHull(contour)
    max_dist = 0
    pt1 = pt2 = None
    for i in range(len(hull)):
        for j in range(i + 1, len(hull)):
            p1 = tuple(hull[i][0])
            p2 = tuple(hull[j][0])
            d = np.linalg.norm(np.array(p1) - np.array(p2))
            if d > max_dist:
                max_dist = d
                pt1 = p1
                pt2 = p2
    return max_dist, pt1, pt2

def extract_and_save_cutouts(image_path,conversion,output_dir="bw-cutout",invert=True, morph_close=True):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    performance_dir = os.path.join(output_dir, "performance")
    if not os.path.exists(performance_dir):
        os.makedirs(performance_dir)
    
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Image not found. Check the file path.")
    
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    if invert:
        gray = 255 - gray
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    if morph_close:
        kernel = np.ones((3, 3), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    image_with_boxes = image.copy()
    
    object_count = 0
    cutout_index = 0
    measurements = []  # For CSV
    longest_sides_pixels = []  # For plotting CDF

    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        if w < 5 or h < 5:
            continue
        
        cv2.rectangle(image_with_boxes, (x, y), (x + w, y + h), (0, 255, 0), 2)
        object_count += 1
        
        roi = image[y:y+h, x:x+w]
        mask = np.zeros((h, w), dtype=np.uint8)
        contour_shifted = contour - [x, y]
        cv2.drawContours(mask, [contour_shifted], -1, 255, thickness=-1)
        
        roi_bgra = cv2.cvtColor(roi, cv2.COLOR_BGR2BGRA)
        roi_bgra[:, :, 3] = mask
        
        longest_side_px, pt1, pt2 = measure_longest_side_from_contour(contour_shifted)
        longest_sides_pixels.append(longest_side_px)
        longest_side_cm = longest_side_px * conversion
        
        if longest_side_px > 0 and pt1 is not None and pt2 is not None:
            cv2.line(roi_bgra, pt1, pt2, (0, 0, 255, 255), thickness=2)
            cv2.circle(roi_bgra, pt1, 4, (0, 0, 255, 255), -1)
            cv2.circle(roi_bgra, pt2, 4, (0, 0, 255, 255), -1)
        
        cutout_filename = os.path.join(performance_dir, f"cutout_{cutout_index:03d}.png")
        cv2.imwrite(cutout_filename, roi_bgra)
        print(f"Saved cutout: {cutout_filename}")
        
        measurements.append({
            "cutout_index": cutout_index,
            "bounding_box": f"({x}, {y}, {w}, {h})",
            "longest_side_px": longest_side_px,
            "longest_side_cm": longest_side_cm
        })
        cutout_index += 1
    
    image_name = os.path.basename(image_path)
    output_path = os.path.join(output_dir, f"annotated_{image_name}")
    cv2.imwrite(output_path, image_with_boxes)
    
    csv_path = os.path.join(output_dir, "object_longest_side_measurements.csv")
    with open(csv_path, mode='w', newline='') as csv_file:
        fieldnames = ["cutout_index", "bounding_box", "longest_side_px", "longest_side_cm"]
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        for entry in measurements:
            writer.writerow(entry)
    print(f"CSV measurements saved to: {csv_path}")
    print(f"Detected {object_count} objects.")
    print(f"Annotated image saved to: {output_path}")
        # --- Compute threshold percentages ---
    # Define thresholds in mm
    thresholds_mm = [4000, 2000, 1000, 750, 500, 250, 125, 88, 63, 44, 32, 22, 16, 11, 7.8, 5.5, 4]
    # Convert measured longest sides from pixels to mm
    converted_sizes = [m * conversion for m in longest_sides_pixels]
    
    threshold_percentages = {}
    total_measurements = len(converted_sizes)
    if total_measurements > 0:
        for thresh in thresholds_mm:
            count_below = np.sum(np.array(converted_sizes) <= thresh)
            percent_below = (count_below / total_measurements) * 100
            threshold_percentages[thresh] = percent_below
    else:
        for thresh in thresholds_mm:
            threshold_percentages[thresh] = 0.0
    
    # Return the threshold percentages along with other data.
    return object_count, output_path, longest_sides_pixels, threshold_percentages

def combined_plot(kuzram_data, measurements_pixels, conversion, save_path="combined_plot.png"):
    plt.figure(figsize=(10, 8))
    sizes = kuzram_data["sizes"]
    distribution = kuzram_data["distribution"]
    plt.plot(sizes, distribution, label=f"Kuz-Ram Distribution\nX50 = {kuzram_data['X50']:.2f} cm", linestyle='-', color='blue')
    if kuzram_data["P10"] is not None:
        plt.axvline(kuzram_data["P10"], color='green', linestyle='--', label=f'P10 = {kuzram_data["P10"]:.2f} cm')
    if kuzram_data["P20"] is not None:
        plt.axvline(kuzram_data["P20"], color='cyan', linestyle='--', label=f'P20 = {kuzram_data["P20"]:.2f} cm')
    if kuzram_data["P80"] is not None:
        plt.axvline(kuzram_data["P80"], color='purple', linestyle='--', label=f'P80 = {kuzram_data["P80"]:.2f} cm')
    if kuzram_data["P90"] is not None:
        plt.axvline(kuzram_data["P90"], color='orange', linestyle='--', label=f'P90 = {kuzram_data["P90"]:.2f} cm')
    plt.axvline(kuzram_data["X50"], color='magenta', linestyle='-.', label=f'X50 = {kuzram_data["X50"]:.2f} cm')
    if len(measurements_pixels) > 1:
        valid_pixels = measurements_pixels[1:]  # Exclude the first measurement if desired
        measurements_cm = [m * conversion for m in valid_pixels]
        sorted_meas = np.sort(measurements_cm)
        n = len(sorted_meas)
        cumulative_percentage = np.arange(1, n + 1) / n * 100
        plt.plot(sorted_meas, cumulative_percentage, marker='o', linestyle='-', label="CDF of Object Sizes", color='red')
    plt.xlabel("Size (cm)")
    plt.ylabel("Cumulative Percentage (%)")
    plt.title("Combined Kuz-Ram Distribution and CDF")
    plt.grid(True)
    plt.legend(loc='best')
    plt.savefig(save_path, dpi=300)
    print(f"Combined plot saved to: {save_path}")
    plt.show()
if __name__ == "__main__":
    A = 5.955   
    K = 0.139   # Powder factor (kg/m³)
    Q = 66.725  # Explosive charge per hole (kg)
    E = 100     # Relative weight strength (e.g., ANFO vs. TNT)
    n = 1.851   # Uniformity index
    kuzram_data = compute_kuz_ram_data(A, K, Q, E, n)
    image_path = "mainfoto.jpg"
    conversion = 0.1203
    _, _, longest_sides_pixels,threshold = extract_and_save_cutouts(image_path,conversion)
    combined_plot(kuzram_data, longest_sides_pixels, conversion,save_path="combined_plot.png")
    print(f"X50: {kuzram_data['X50']:.2f} cm")
    print(f"P10: {kuzram_data['P10'] if kuzram_data['P10'] is not None else 'Not Reached'} cm")
    print(f"P20: {kuzram_data['P20'] if kuzram_data['P20'] is not None else 'Not Reached'} cm")
    print(f"P80: {kuzram_data['P80'] if kuzram_data['P80'] is not None else 'Not Reached'} cm")
    print(f"P90: {kuzram_data['P90'] if kuzram_data['P90'] is not None else 'Not Reached'} cm")
    print(f"Percentage Below 60 cm: {kuzram_data['percentage_below_60']:.2f}%")
    print(f"Percentage Above 60 cm: {kuzram_data['percentage_above_60']:.2f}%")
    print(threshold)
