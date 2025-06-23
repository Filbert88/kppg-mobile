import cv2
import pytesseract
from PIL import Image
import numpy as np

# Set path if tesseract is not in PATH (customize to your install!)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

img_path = "temp_ocr/cleaned/clean_line_merged_09.jpg"
img = cv2.imread(img_path)
if img is None:
    raise FileNotFoundError(f"Gambar tidak ditemukan atau gagal dibaca: {img_path}")


# 1. Grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 2. Remove small noise with median blur
blurred = cv2.medianBlur(gray, 3)

# 3. Histogram Equalization for contrast
eq = cv2.equalizeHist(blurred)

# 4. Try both global Otsu and adaptive threshold, then combine with bitwise_or
_, otsu = cv2.threshold(eq, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
adapt = cv2.adaptiveThreshold(eq, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 15)
combined = cv2.bitwise_or(otsu, adapt)

# 5. Morphology to close gaps, connect broken digits
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
morph = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel, iterations=1)

# 6. (Optional) Remove very small objects (noise blobs) using contours
contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
morph_clean = np.zeros_like(morph)
for c in contours:
    if cv2.contourArea(c) > 15:  # area threshold, tune as needed
        cv2.drawContours(morph_clean, [c], -1, 255, -1)
final = morph_clean

# Save debug output if needed
cv2.imwrite('debug_final.png', final)

# 7. Tesseract configs: try several PSM for robustness
configs = [
    r'--oem 1 --psm 6 -c tessedit_char_whitelist=0123456789',
    r'--oem 1 --psm 11 -c tessedit_char_whitelist=0123456789',
    r'--oem 1 --psm 7 -c tessedit_char_whitelist=0123456789'
]

# Try each config and keep the best (most non-empty digits)
results = []
for cfg in configs:
    data = pytesseract.image_to_data(final, config=cfg, output_type=pytesseract.Output.DICT)
    digits = [t for t in data['text'] if t.strip().isdigit()]
    # confs = [float(c) for i, c in enumerate(data['conf']) if t.strip().isdigit() and data['text'][i].strip() != '']
    confs = [float(c) for i, c in enumerate(data['conf']) if data['text'][i].strip().isdigit() and data['text'][i].strip() != '']

    results.append({'cfg': cfg, 'digits': digits, 'confs': confs, 'data': data})

# Choose the config with most digits
best = max(results, key=lambda d: len(d['digits']))

print("\n--- BEST RESULT ---")
print("Config:", best['cfg'])
print("Digits:", best['digits'])
print("Confidences:", best['confs'])

# Show per-box data for debugging
for i, t in enumerate(best['data']['text']):
    if t.strip() != '' and t.strip().isdigit():
        print(f"Text: '{t}'  Conf: {best['data']['conf'][i]}  Box: {best['data']['left'][i]}, {best['data']['top'][i]}, {best['data']['width'][i]}, {best['data']['height'][i]}")

# Full OCR text
full_text = pytesseract.image_to_string(final, config=best['cfg'])
print("\nFull OCR Output:\n", full_text)