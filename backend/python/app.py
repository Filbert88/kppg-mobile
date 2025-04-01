import os
import json
import uuid
from flask import Flask, request, jsonify, send_file
from ocr import OCR
# from frag import fragmentation
from kuzram import kuz_ram_model

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
    file.save(temp_filename)

    temp_folder = "helper_output"
    output_folder = "output"

    OCR(temp_filename, temp_folder, output_folder)

    base_name = os.path.splitext(os.path.basename(temp_filename))[0]
    result_json_path = os.path.join(output_folder, f"res_{base_name}.json")

    if not os.path.exists(result_json_path):
        return jsonify({'error': 'No OCR result found'}), 500

    with open(result_json_path, 'r') as f:
        ocr_data = json.load(f)

    response = {
        'ocr_result': ocr_data  
    }

    os.remove(temp_filename)
    os.remove(result_json_path)

    return jsonify(response)

# @app.route('/fragment', methods=['POST'])
# def fragment():
#     if 'file' not in request.files:
#         return jsonify({"error": "No file found"}), 400
    
#     file = request.files['file']
#     if file.filename == '':
#         return jsonify({"error": "No file name"}), 400

#     unique_id = str(uuid.uuid4())
#     input_filename = f"temp_{unique_id}.jpg"
#     output_filename = f"output_frag_{unique_id}.png"

#     file.save(input_filename)

#     fragmentation(input_filename, output_filename)

#     os.remove(input_filename)

#     return send_file(output_filename, mimetype='image/png')

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
