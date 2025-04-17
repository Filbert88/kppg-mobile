import os
import json
import uuid
import logging
import matplotlib
matplotlib.use('Agg')
from flask import Flask, request, jsonify, send_file
# Import the fragmentation functions from your module
from frag import fragmentation_to_outline
from ocr import OCR
from kuzram import kuz_ram_model
from io import BytesIO
import uuid
import cv2
import numpy as np
import time
import shutil  
# Import the marker extraction functions
from object_detector import extract_marker_properties
import io
import base64
from final import compute_kuz_ram_data, extract_and_save_cutouts, combined_plot
from matplotlib import pyplot as plt
import requests

def run_full_fragmentation_analysis(image_path: str, A: float, K: float, Q: float, E: float, n: float, conversion: float):
    # Compute the Kuz-Ram data.
    kuzram_data = compute_kuz_ram_data(A, K, Q, E, n)
    
    # Create a unique output folder for cutouts.
    unique_output = os.path.join(os.getcwd(), f"bw-cutout_{uuid.uuid4()}")
    os.makedirs(unique_output, exist_ok=True)
    
    # Call extract_and_save_cutouts with the unique output directory.
    _, _, longest_sides_pixels, threshold_percentages = extract_and_save_cutouts(image_path, conversion, output_dir=unique_output)
    
    # === Generate the combined plot ===
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
    
    if len(longest_sides_pixels) > 1:
        measurements_cm = [m * conversion for m in longest_sides_pixels[1:]]
        sorted_meas = np.sort(measurements_cm)
        n_points = len(sorted_meas)
        cumulative_percentage = np.arange(1, n_points + 1) / n_points * 100
        plt.plot(sorted_meas, cumulative_percentage, marker='o', linestyle='-', label="CDF of Object Sizes", color='red')
    
    plt.xlabel("Size (cm)")
    plt.ylabel("Cumulative Percentage (%)")
    plt.title("Combined Kuz-Ram Distribution and CDF")
    plt.grid(True)
    plt.legend(loc='best')
    
    # Save the plot to a buffer.
    buffer = io.BytesIO()
    plt.savefig(buffer, format="png", dpi=300)
    plt.close()
    buffer.seek(0)
    upload_resp = requests.post(
        "http://localhost:5180/api/Upload/upload",
        files={"file": ("plot.png", buffer, "image/png")}
    )
    upload_resp.raise_for_status()
    plot_url = upload_resp.json()["url"]
    
    # Delete only the unique output folder (bw-cutout_{uuid}) after processing.
    shutil.rmtree(unique_output, ignore_errors=True)
    
    return {
        "kuzram": {
            "sizes": kuzram_data["sizes"].tolist(),
            "distribution": kuzram_data["distribution"].tolist(),
            "X50": kuzram_data["X50"],
            "P10": kuzram_data["P10"],
            "P20": kuzram_data["P20"],
            "P80": kuzram_data["P80"],
            "P90": kuzram_data["P90"],
            "percentage_below_60": kuzram_data["percentage_below_60"],
            "percentage_above_60": kuzram_data["percentage_above_60"]
        },
        "threshold_percentages": threshold_percentages,
        "plot_image_base64": plot_url
    }

app = Flask(__name__)

@app.route('/ocr', methods=['POST'])
def ocr_endpoint():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400


    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    unique_id = str(uuid.uuid4())
    temp_filename = f"temp_image_{unique_id}.jpg"
    unique_id = str(uuid.uuid4())
    temp_filename = f"temp_image_{unique_id}.jpg"
    file.save(temp_filename)

    temp_folder = "temp_ocr"
    output_folder = "output_ocr"

    try:
        OCR(temp_filename, temp_folder, output_folder)
    except Exception as e:
        os.remove(temp_filename)
        return jsonify({"error": "Error processing OCR"}), 500

    base_name = os.path.splitext(os.path.basename(temp_filename))[0]
    result_json_path = os.path.join(output_folder, f'res_{base_name}.json')

    if not os.path.exists(result_json_path):
        os.remove(temp_filename)
        return jsonify({'error': 'No OCR result found'}), 500

    with open(result_json_path, 'r') as f:
        ocr_data = json.load(f)

    response = {
        'ocr_result': ocr_data
    }
    os.remove(temp_filename)
    os.remove(result_json_path)

    return jsonify(response)

def wait_until_file_ready(path: str, timeout: float = 5.0) -> bool:
    """Retry opening the file directly until it's readable (ignore existence only)."""
    import time
    start = time.time()
    while time.time() - start < timeout:
        try:
            with open(path, "rb") as f:
                f.read(1)
            return True
        except (PermissionError, OSError):
            time.sleep(0.05)  # wait 50ms and try again
    return False

@app.route('/fragmentation-red-outline', methods=['POST'])
def fragmentation_red_outline():
    """
    This endpoint expects an image file uploaded as "file".
    It will process the image to create a segmentation result,
    then use the generated cutouts to extract marker properties.
    
    The JSON response will include:
      - output_image: the segmentation result image encoded as a base64 string.
      - marker_properties: a dict containing the marker filename,
                           the longest side in pixels, and the conversion factor.
    """
    file = request.files.get("file")
    if not file or file.filename == "":
        return jsonify({"error": "No file uploaded"}), 400

    try:
        # Generate a unique ID
        uid = str(uuid.uuid4())
        # Read the image from the request
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if image is None:
            return jsonify({"error": "Invalid image file"}), 400

        # Save the input image temporarily
        input_filename = f"in_memory_input_{uid}.jpg"
        cv2.imwrite(input_filename, image)

        # Create a unique output folder
        output_folder = f"output_frag/output_frag_red_outline_{uid}"

        # Call fragmentation_to_outline, which processes the image, saves segmentation result
        # and cutouts; it returns the processed segmentation image.
        output_image = fragmentation_to_outline(input_filename, output_folder)

        # Clean up the temporary input file
        if os.path.exists(input_filename):
            os.remove(input_filename)

        # Determine the image name (based on the input file)
        image_name = os.path.splitext(os.path.basename(input_filename))[0]
        # Calculate the cutouts folder path generated by the segmentation process
        cutouts_folder = os.path.join(output_folder, f"cutouts_{image_name}")
        print(cutouts_folder)
        
        # Call extract_marker_properties on the cutouts folder to get the marker info
        _,_,conversion_factor = extract_marker_properties(cutouts_folder)
        marker_data = {
            "conversion_factor": conversion_factor
        }

        # Save the marker extraction info as JSON in the cutouts folder
        marker_properties_path = os.path.join(cutouts_folder, "marker_properties.json")
        with open(marker_properties_path, "w") as f:
            json.dump(marker_data, f)

        # Encode the output segmentation image as JPEG and then base64
        ret, buffer = cv2.imencode('.jpg', output_image)
        if not ret:
            return jsonify({"error": "Failed to encode output image"}), 500
        encoded_image = base64.b64encode(buffer).decode('utf-8')

        response = {
            "output_image": encoded_image,
            "marker_properties": marker_data
        }

        shutil.rmtree(output_folder, ignore_errors=True)
        return jsonify(response)

    except Exception as e:
        return jsonify({"error": f"Fragmentation failed: {str(e)}"}), 500

@app.route("/fragmentation-analysis", methods=["POST"])
def fragmentation_analysis():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        # Get parameters from form-data
        A = float(request.form.get("A"))
        K = float(request.form.get("K"))
        Q = float(request.form.get("Q"))
        E = float(request.form.get("E"))
        n = float(request.form.get("n"))
        conversion = float(request.form.get("conversion"))  # mm/px

        # Save image temporarily
        uid = str(uuid.uuid4())
        temp_filename = f"fragment_{uid}.jpg"
        file.save(temp_filename)

        # Perform full analysis
        result = run_full_fragmentation_analysis(
            temp_filename, A, K, Q, E, n, conversion
        )

        os.remove(temp_filename)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/kuzram', methods=['POST'])
def kuzram_endpoint():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400
    try:
        A = float(data["A"])
        K = float(data["K"])
        Q = float(data["Q"])
        E = float(data["E"])
        n = float(data["n"])
    except (KeyError, ValueError) as e:
        return jsonify({"error": "Invalid or missing parameters"}), 400

    result = kuz_ram_model(A, K, Q, E, n)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
