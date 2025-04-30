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
import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from dotenv import load_dotenv

from image_ssim_pipeline import analyze_images_api
from ppe_detection import detect_ppe

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration from environment variables
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', './static/uploads/')
RESULT_FOLDER = os.getenv('RESULT_FOLDER', './static/results/')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
PPE_MODEL_PATH = os.getenv("PPE_MODEL_PATH", "Model/ibcm-ppe.pt")

# SSL configuration
SSL_CERT = os.getenv("SSL_CERT", "adhoc")
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

        # Extract project_id
        project_id = request.form.get('project_id')
        
        # Save images to temporary files for compatibility
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as prev_tmp, \
             tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as curr_tmp:
            cv2.imwrite(prev_tmp.name, prev_img)
            cv2.imwrite(curr_tmp.name, curr_img)
            prev_path = prev_tmp.name
            curr_path = curr_tmp.name

            # Save the uploaded files permanently
            prev_file.seek(0)
            curr_file.seek(0)
            prev_image_path = save_image_file(prev_file)
            curr_image_path = save_image_file(curr_file)

        try:
            results = analyze_images_api(
                prev_path,
                curr_path,
                steady_camera=steady_camera,
                resize_width=resize_width,
                win_size=win_size,
                resize_factor=resize_factor
            )
            
            # Save previous and current images if project_id is provided
            prev_image_id = None
            curr_image_id = None
            
            if project_id:
                
                conn = get_db_connection()
                cursor = conn.cursor()
                
                # Save previous image
                cursor.execute("""
                    INSERT INTO images 
                    (project_id, image_path, image_type, activity_type, remarks, is_valid) 
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (project_id, prev_image_path, 'progress', 
                      request.form.get('activity_type', 'foundation'), 
                      'Previous image for SSIM analysis', True))
                prev_image_id = cursor.lastrowid
                
                # Save current image
                cursor.execute("""
                    INSERT INTO images 
                    (project_id, image_path, image_type, activity_type, remarks, is_valid) 
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (project_id, curr_image_path, 'progress', 
                      request.form.get('activity_type', 'foundation'), 
                      'Current image for SSIM analysis', True))
                curr_image_id = cursor.lastrowid
                
                # Record the progress log
                cursor.execute("""
                    INSERT INTO progress_logs 
                    (project_id, previous_image_id, current_image_id, ssim_score, detected_change) 
                    VALUES (%s, %s, %s, %s, %s)
                """, (project_id, prev_image_id, curr_image_id, 
                      results["score"], request.form.get('detected_change', 'Progress detected')))
                
                # Add audit log
                cursor.execute("""
                    INSERT INTO audit_logs 
                    (action, details) 
                    VALUES (%s, %s)
                """, ('SSIM_ANALYSIS', f'SSIM analysis performed for project {project_id}'))
                
                conn.commit()
                cursor.close()
                conn.close()
                
            # Add image IDs to the response if available
            if prev_image_id and curr_image_id:
                results["previous_image_id"] = prev_image_id
                results["current_image_id"] = curr_image_id
                
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

        file.seek(0)
        image_path = save_image_file(file)
        
        # Extract project_id
        project_id = request.form.get('project_id')
        
        # If project_id provided, save the image and detection results
        image_id = None
        if project_id:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Save the image
            cursor.execute("""
                INSERT INTO images 
                (project_id, image_path, image_type, activity_type, remarks, is_valid) 
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (project_id, image_path, 'safety', 
                  request.form.get('activity_type', 'foundation'), 
                  request.form.get('remarks', 'PPE detection analysis'), True))
            
            image_id = cursor.lastrowid
            
            # Save the PPE detection results
            cursor.execute("""
                INSERT INTO ppe_results 
                (image_id, hardhat, mask, no_hardhat, no_mask, no_safety_vest, person, safety_cone, safety_vest, machinery, vehicle) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                image_id,
                class_counts.get("Hardhat", 0),
                class_counts.get("Mask", 0),
                class_counts.get("NO-Hardhat", 0),
                class_counts.get("NO-Mask", 0),
                class_counts.get("NO-Safety Vest", 0),
                class_counts.get("Person", 0),
                class_counts.get("Safety Cone", 0),
                class_counts.get("Safety Vest", 0),
                class_counts.get("machinery", 0),
                class_counts.get("vehicle", 0)
            ))
            
            # Add audit log
            cursor.execute("""
                INSERT INTO audit_logs 
                (action, details) 
                VALUES (%s, %s)
            """, ('PPE_DETECTION', f'PPE detection performed for project {project_id}'))
            
            conn.commit()
            cursor.close()
            conn.close()
        
        response_data = {
            "class_counts": class_counts,
            "detailed_counts": detailed_counts,
            "annotated_image": encode_image(result["annotated_image"])
        }
           
        return jsonify(response_data), 200
    except KeyError:
        return jsonify({"error": "No file uploaded"}), 400
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Analytics Endpoint ---
@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get project statistics without filtering by user
        cursor.execute("""
            SELECT 
                COUNT(*) AS total_projects,
                SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) AS planned_projects,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_projects,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_projects,
                SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) AS on_hold_projects
            FROM projects p
        """)
        
        project_stats = cursor.fetchone()
        
        # Get image statistics
        cursor.execute("""
            SELECT 
                COUNT(*) AS total_images,
                SUM(CASE WHEN image_type = 'progress' THEN 1 ELSE 0 END) AS progress_images,
                SUM(CASE WHEN image_type = 'safety' THEN 1 ELSE 0 END) AS safety_images
            FROM images i
            JOIN projects p ON i.project_id = p.id
        """)
        
        image_stats = cursor.fetchone()
        
        # Get PPE compliance statistics
        cursor.execute("""
            SELECT 
                SUM(pr.person) AS total_persons,
                SUM(pr.hardhat) AS total_hardhats,
                SUM(pr.safety_vest) AS total_safety_vests,
                SUM(pr.mask) AS total_masks,
                SUM(pr.no_hardhat) AS total_no_hardhats,
                SUM(pr.no_safety_vest) AS total_no_safety_vests,
                SUM(pr.no_mask) AS total_no_masks
            FROM ppe_results pr
            JOIN images i ON pr.image_id = i.id
            JOIN projects p ON i.project_id = p.id
        """)
        
        ppe_stats = cursor.fetchone()
        
        # Get SSIM analysis statistics
        cursor.execute("""
            SELECT 
                COUNT(*) AS total_analyses,
                AVG(ssim_score) AS avg_ssim_score,
                MIN(ssim_score) AS min_ssim_score,
                MAX(ssim_score) AS max_ssim_score
            FROM progress_logs pl
            JOIN projects p ON pl.project_id = p.id
        """)
        
        ssim_stats = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Calculate safety compliance percentages
        safety_compliance = {
            "hardhat_compliance": 0,
            "vest_compliance": 0,
            "mask_compliance": 0,
            "overall_compliance": 0
        }
        
        if ppe_stats and ppe_stats['total_persons'] > 0:
            total_persons = ppe_stats['total_persons']
            hardhat_compliance = (ppe_stats['total_hardhats'] / total_persons) * 100
            vest_compliance = (ppe_stats['total_safety_vests'] / total_persons) * 100
            mask_compliance = (ppe_stats['total_masks'] / total_persons) * 100
            
            # Calculate overall compliance as average of individual compliances
            overall_compliance = (hardhat_compliance + vest_compliance + mask_compliance) / 3
            
            safety_compliance = {
                "hardhat_compliance": round(hardhat_compliance, 2),
                "vest_compliance": round(vest_compliance, 2),
                "mask_compliance": round(mask_compliance, 2),
                "overall_compliance": round(overall_compliance, 2)
            }
        
        return jsonify({
            "project_stats": project_stats,
            "image_stats": image_stats,
            "ppe_stats": ppe_stats,
            "ssim_stats": ssim_stats,
            "safety_compliance": safety_compliance
        }), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv('MYSQL_HOST', 'localhost'),
        user=os.getenv('MYSQL_USER', 'root'),
        password=os.getenv('MYSQL_PASSWORD', ''),
        database=os.getenv('MYSQL_DATABASE', 'ibcm'),
        auth_plugin='mysql_native_password'
    )

# --- User Registration --- 
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'engineer')
    if not all([name, username, email, password]):
        return jsonify({'error': 'Missing required fields'}), 400
    password_hash = generate_password_hash(password)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (name, username, email, password_hash, role) VALUES (%s, %s, %s, %s, %s)",
                       (name, username, email, password_hash, role))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'User registered successfully'}), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500

# --- User Login ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not all([username, password]):
        return jsonify({'error': 'Missing username or password'}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        if user and check_password_hash(user['password_hash'], password):
            # Return user information directly instead of creating a JWT token
            return jsonify({
                'id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'name': user['name'],
                'email': user['email']
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Error as e:
        return jsonify({'error': str(e)}), 500

# --- Project Creation (under logged-in user) ---
@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.get_json()
    name = data.get('name')
    location = data.get('location')
    description = data.get('description')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    status = data.get('status', 'planned')
    created_by = data.get('user_id')  # Get user ID from request data instead of JWT
    if not all([name, location, created_by]):
        return jsonify({'error': 'Missing required fields'}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO projects (name, location, description, start_date, end_date, status, created_by) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                       (name, location, description, start_date, end_date, status, created_by))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Project created successfully'}), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500

# --- Project Listing (for logged-in user) ---
@app.route('/api/projects', methods=['GET'])
def get_projects():
    # Get user_id from query parameter instead of JWT
    user_id = request.args.get('user_id')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        if user_id:
            # Filter projects by user_id if provided
            cursor.execute("SELECT * FROM projects WHERE created_by=%s", (user_id,))
        else:
            # Otherwise return all projects
            cursor.execute("SELECT * FROM projects")
            
        projects = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'projects': projects}), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500

def save_image_file(file):
    """Save an uploaded file to disk with a unique filename and return the path"""
    if file and allowed_file(file.filename):
        # Generate a unique filename to prevent overwriting
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        unique_filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        return os.path.join('static/uploads', unique_filename)
    return None

# --- Image Upload (Progress/Safety) ---
@app.route('/api/images', methods=['POST'])
def upload_image():
    try:
        # Get user_id from form data instead of JWT
        user_id = request.form.get('user_id')
        
        # Get form data
        project_id = request.form.get('project_id')
        image_type = request.form.get('image_type')  # 'progress' or 'safety'
        activity_type = request.form.get('activity_type')  # e.g., 'foundation', 'super_structure', etc.
        remarks = request.form.get('remarks', '')
        
        # Validate required fields
        if not all([project_id, image_type, activity_type, user_id]):
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Validate image_type is either 'progress' or 'safety'
        if image_type not in ['progress', 'safety']:
            return jsonify({'error': 'Invalid image type'}), 400
            
        # Validate activity_type
        valid_activity_types = ['foundation', 'super_structure', 'facade', 'interiors', 'finishing']
        if activity_type not in valid_activity_types:
            return jsonify({'error': 'Invalid activity type'}), 400
            
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        # Save the file and get the path
        image_path = save_image_file(file)
        if not image_path:
            return jsonify({'error': 'Invalid file format'}), 400
            
        # Insert image record into database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO images 
            (project_id, user_id, image_path, image_type, activity_type, remarks, is_valid) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (project_id, user_id, image_path, image_type, activity_type, remarks, True))
        
        conn.commit()
        image_id = cursor.lastrowid
        
        # Add audit log
        cursor.execute("""
            INSERT INTO audit_logs 
            (user_id, action, details) 
            VALUES (%s, %s, %s)
        """, (user_id, 'UPLOAD_IMAGE', f'Image {image_path} uploaded for project {project_id}'))
        
        conn.commit()
        
        # If it's a safety image, process it for PPE detection
        result = None
        if image_type == 'safety':
            # Reload the file for processing
            file.seek(0)
            img = get_image_from_request(file)
            result = detect_ppe(img, yolo_model)
            
            # Store PPE detection results
            if result:
                cursor.execute("""
                    INSERT INTO ppe_results 
                    (image_id, hardhat, mask, no_hardhat, no_mask, no_safety_vest, person, safety_cone, safety_vest, machinery, vehicle) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    image_id,
                    result["class_counts"].get("Hardhat", 0),
                    result["class_counts"].get("Mask", 0),
                    result["class_counts"].get("NO-Hardhat", 0),
                    result["class_counts"].get("NO-Mask", 0),
                    result["class_counts"].get("NO-Safety Vest", 0),
                    result["class_counts"].get("Person", 0),
                    result["class_counts"].get("Safety Cone", 0),
                    result["class_counts"].get("Safety Vest", 0),
                    result["class_counts"].get("machinery", 0),
                    result["class_counts"].get("vehicle", 0)
                ))
                conn.commit()
        
        cursor.close()
        conn.close()
        
        response_data = {
            'message': 'Image uploaded successfully',
            'image_id': image_id,
            'image_path': image_path
        }
        
        if result:
            response_data['ppe_results'] = {
                'class_counts': result["class_counts"],
                'annotated_image': encode_image(result["annotated_image"])
            }
            
        return jsonify(response_data), 201
        
    except Error as e:
        return jsonify({'error': f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Reporting Stub ---
@app.route('/api/reports', methods=['GET'])
def get_reports():
    # Get user_id from query parameter instead of JWT
    user_id = request.args.get('user_id')
    
    # TODO: Generate and return reports (optionally filtered by user_id)
    return jsonify({'reports': []}), 200

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