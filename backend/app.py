from flask import Flask, request, jsonify, send_from_directory
import os
from werkzeug.utils import secure_filename
from flask_cors import CORS
from ultralytics import YOLO
import numpy as np
import cv2
import base64
import tempfile
import ssl

from image_ssim_pipeline import analyze_images_api
from ppe_detection import detect_ppe

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = './static/uploads/'
RESULT_FOLDER = './static/results/'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
PPE_MODEL_PATH = os.getenv("PPE_MODEL_PATH", "Model/ibcm-ppe.pt")

# SSL configuration
SSL_CERT = os.getenv("SSL_CERT", "adhoc")  # Using 'adhoc' for auto-generated self-signed cert
SSL_ENABLED = os.getenv("SSL_ENABLED", "true").lower() == "true"

# Ensure upload/result folders exist at startup
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

yolo_model = YOLO(PPE_MODEL_PATH)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def encode_image(img, ext='.jpg'):
    _, buffer = cv2.imencode(ext, img)
    return base64.b64encode(buffer).decode('utf-8')

def get_image_from_request(file_storage):
    if not allowed_file(file_storage.filename):
        raise ValueError("Invalid file type")
    img_bytes = np.frombuffer(file_storage.read(), np.uint8)
    img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image data")
    return img

@app.route('/api/ssim', methods=['POST'])
def api_ssim():
    """
    Progress API SSIM:
    Accepts two images, computes SSIM and alignment, returns:
      - score, homography, img1_overlap, img2_overlap, outlined, ssim_img, overlap_mask (all images base64-encoded)
    """
    try:
        prev_file = request.files['previous_image']
        curr_file = request.files['current_image']
        prev_img = get_image_from_request(prev_file)
        curr_img = get_image_from_request(curr_file)

        steady_camera = request.form.get('steady_camera', 'false').lower() == 'true'
        resize_width = int(request.form.get('resize_width', 500))
        win_size = tuple(map(int, request.form.get('win_size', '11,11').split(',')))
        resize_factor = int(request.form.get('resize_factor', 1))

        # Save images to temporary files for compatibility
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as prev_tmp, \
             tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as curr_tmp:
            cv2.imwrite(prev_tmp.name, prev_img)
            cv2.imwrite(curr_tmp.name, curr_img)
            prev_path = prev_tmp.name
            curr_path = curr_tmp.name

        try:
            results = analyze_images_api(
                prev_path,
                curr_path,
                steady_camera=steady_camera,
                resize_width=resize_width,
                win_size=win_size,
                resize_factor=resize_factor
            )
        finally:
            # Clean up temp files
            os.remove(prev_path)
            os.remove(curr_path)

        return jsonify({
            "score": results["score"],
            "homography": results["homography"].tolist() if hasattr(results["homography"], "tolist") else results["homography"],
            "img1_overlap": encode_image(results["img1_overlap"]),
            "img2_overlap": encode_image(results["img2_overlap"]),
            "outlined": encode_image(results["outlined"]),
            "ssim_img": encode_image(results["ssim_img"]),
            "overlap_mask": encode_image(results["overlap_mask"], ext='.png')
        }), 200
    except KeyError:
        return jsonify({"error": "Please provide both previous and current images"}), 400
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ppe-detection', methods=['POST'])
def api_ppe_detection():
    """
    PPE Detection API:
    Accepts one image, runs PPE detection, returns:
      - class_counts, detailed_counts, annotated_image (base64-encoded)
    """
    try:
        file = request.files['file']
        img = get_image_from_request(file)
        result = detect_ppe(img, yolo_model)
        class_counts = {k: int(v) for k, v in result["class_counts"].items()}
        detailed_counts = {k: int(v) for k, v in result["detailed_counts"].items()}
        return jsonify({
            "class_counts": class_counts,
            "detailed_counts": detailed_counts,
            "annotated_image": encode_image(result["annotated_image"])
        }), 200
    except KeyError:
        return jsonify({"error": "No file uploaded"}), 400
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/static/uploads/<filename>')
def serve_uploaded_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/static/results/<filename>')
def serve_result_image(filename):
    return send_from_directory(RESULT_FOLDER, filename)

if __name__ == '__main__':
    if SSL_ENABLED:
        # For auto-generated self-signed cert, use ssl_context='adhoc'
        # For specific cert files, use ssl_context=(cert_file, key_file)
        if SSL_CERT == "adhoc":
            try:
                from werkzeug.serving import make_ssl_devcert
                cert_file, key_file = make_ssl_devcert('ssl-cert')
                ssl_context = (cert_file, key_file)
                print(f"Using generated SSL cert: {cert_file}")
            except ImportError:
                # If pyOpenSSL is not installed, fall back to 'adhoc'
                print("Using adhoc SSL cert (install pyOpenSSL for better certs)")
                ssl_context = 'adhoc'
        else:
            # Assuming SSL_CERT is a tuple or path to cert files
            ssl_context = SSL_CERT
        
        print("Starting server with HTTPS enabled")
        app.run(debug=True, ssl_context=ssl_context, host='0.0.0.0', port=5000)
    else:
        print("Starting server with HTTP only")
        app.run(debug=True, host='0.0.0.0', port=5000)