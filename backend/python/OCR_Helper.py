import os
import cv2
import numpy as np
from paddleocr import PaddleOCR, draw_ocr
from PIL import Image
import json
import shutil

def show_resized(image, window_name="Image", max_width=1000, max_height=700):
    h, w = image.shape[:2]
    scale = min(max_width / w, max_height / h, 1.0)
    resized = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    cv2.imshow(window_name, resized)

def process_image(img_path, output_base, black_pixel_threshold=50, margin_size=150, min_red_area=800):
    image = cv2.imread(img_path)

    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    lower_blue = np.array([85, 45, 45])
    upper_blue = np.array([100, 250, 250])
    blue_mask = cv2.inRange(hsv, lower_blue, upper_blue)
    image[blue_mask > 0] = [255, 255, 255]

    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    lower_red1 = np.array([0, 100, 60])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 100, 60])
    upper_red2 = np.array([180, 255, 255])
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = cv2.bitwise_or(mask1, mask2)

    contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    valid_red_regions = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        if w * h >= min_red_area:
            valid_red_regions.append((x, y, w, h))

    os.makedirs(output_base, exist_ok=True)

    for idx, contour in enumerate(contours):
        x, y, w, h = cv2.boundingRect(contour)
        if w * h >= min_red_area:
            valid_red_regions.append((x, y, w, h))
            cropped_region = image[y:y + h, x:x + w]

            # Save the cropped red region
            red_region_path = os.path.join(output_base, f"red_region_{idx + 1}.jpg")
            cv2.imwrite(red_region_path, cropped_region)

    output_files = []
    for idx, (x, y, w, h) in enumerate(valid_red_regions):
        cropped_region = image[y:y + h, x:x + w]
        if h > 150:
            segment_height = h // 30
            for i in range(30):
                seg_y1, seg_y2 = y + i * segment_height, y + (i + 1) * segment_height
                segment = image[seg_y1 - 5 :seg_y2 + 5, x:x + w] # atas bawah 

                gray_segment = cv2.cvtColor(segment, cv2.COLOR_BGR2GRAY)
                _, binary_segment = cv2.threshold(gray_segment, 50, 255, cv2.THRESH_BINARY_INV)

                non_zero_coords = np.column_stack(np.where(binary_segment > 0))
                if non_zero_coords.size > 0:
                    leftmost_black = non_zero_coords[:, 1].min()
                    rightmost_black = non_zero_coords[:, 1].max()
                    left_crop = max(leftmost_black - 100, 0) # kiri kanan
                    right_crop = min(rightmost_black + 100, segment.shape[1]) # kiri kanan
                    segment = segment[:, left_crop:right_crop]

                    gray_segment = cv2.cvtColor(segment, cv2.COLOR_BGR2GRAY)
                    _, binary_segment = cv2.threshold(gray_segment, 50, 255, cv2.THRESH_BINARY_INV)

                    if np.count_nonzero(binary_segment) >= black_pixel_threshold:
                        output_file = save_with_margin(segment, output_base, idx, i + 1, margin_size)
                        output_files.append(output_file)
        else:
            output_file = save_with_margin(cropped_region, output_base, idx, margin_size=margin_size)
            output_files.append(output_file)

    return output_files

def save_with_margin(image, output_base, idx, part=None, margin_size=150):
    h, w, _ = image.shape
    new_img = np.ones((h + 2 * margin_size, w + 2 * margin_size, 3), dtype=np.uint8) * 255
    new_img[margin_size:margin_size + h, margin_size:margin_size + w] = image
    part_suffix = f"_part_{part}" if part else ""
    output_path = f"{output_base}/cropped_{idx + 1}{part_suffix}.jpg"
    cv2.imwrite(output_path, new_img)
    return output_path

def convert_char(arr):
    mapping = {'A': '4', 'B': '8', 'm': '3', 'G': '6', 'I': '1', 'O': '0', 'S': '5', 'T': '7', 'Z': '2', 'l': '1', 'M': '3', 'g': '9', ',': '.', '+':'7', '-': '', 'D': ''}
    return [[mapping.get(char, char) for char in row] for row in arr]

# TODO: needs to be improved
def parse(data):
    result = []
    for sublist in data:
        processed_sublist = []
        # print(f'sublist: {sublist}')
        for item in sublist:
            temp = []
            buffer = ''
            for char in item:
                if char.lower() == 'x':
                    if buffer:
                        temp.append(buffer)
                    buffer = ''
                else:
                    buffer += char
            if buffer:
                temp.append(buffer)

            final_parts = []
            for part in temp:
                i = 0
                while i < len(part):
                    if i + 2 < len(part) and part[i+1] == '.':
                        final_parts.append(part[i:i+3])
                        i += 3
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

            # print(f'final part: {final_parts}')
            processed_sublist.append(final_parts)
        result.append(processed_sublist)
    return result


def perform_ocr(img_path, font_path='south-park.ttf', output_dir='sample_output'):
    ocr = PaddleOCR(lang='en')
    result = ocr.ocr(img_path, cls=False)

    if not result or not result[0]:
        return []

    image = Image.open(img_path).convert('RGB')
    boxes = [line[0] for line in result[0]]
    txts = [line[1][0] for line in result[0]]
    scores = [line[1][1] for line in result[0]]

    im_show = draw_ocr(image, boxes, txts, scores, font_path=font_path)
    im_show = Image.fromarray(im_show)
    base_filename = os.path.splitext(os.path.basename(img_path))[0]
    output_path = os.path.join(output_dir, f'result_{base_filename}.jpg')
    os.makedirs(output_dir, exist_ok=True)
    im_show.save(output_path)

    return txts

def parse_and_merge(arr):
    length = arr[0][0][0] if arr and arr[0] and arr[0][0] else None
    text = []
    for sublist in arr[1:]:
        for item in sublist:
            text.extend(item)

    return length, text

def ocr_pipeline(folder_path, image_name):
    img_path = os.path.join(folder_path, image_name)
    output_base = f'helper_output/{os.path.splitext(image_name)[0]}'
    processed_files = process_image(img_path, output_base)
    
    all_texts = {}
    for file_path in processed_files:
        texts = perform_ocr(file_path)
        texts = convert_char(texts)
        all_texts[file_path] = texts

    return all_texts

def write_to_json(arr, filename='result.json'):

    data = {str(i + 1): value for i, value in enumerate(arr)}

    with open(filename, 'w') as file:
        json.dump(data, file, indent=4)

def OCR(image_path, temp_folder, output_folder):
    os.makedirs(temp_folder, exist_ok=True)
    os.makedirs(output_folder, exist_ok=True)

    try:
        results = ocr_pipeline(os.path.dirname(image_path), os.path.basename(image_path))
        ress = []
        for file, texts in results.items():
            print(f"{file}: {texts}")
            ress.append(texts)
        ress = parse(ress)
        length, ress = parse_and_merge(ress)
        print(ress)

        base_name = os.path.splitext(os.path.basename(image_path))[0]
        output_file = os.path.join(output_folder, f'res_{base_name}.json')
        write_to_json(ress, output_file)
        print(f"Result saved to: {output_file}")
        
    finally:
        if os.path.exists(temp_folder):
            shutil.rmtree(temp_folder)
            print(f"Deleted temp folder: {temp_folder}")

