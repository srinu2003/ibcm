-- Story: Users interact with the IBCM application

-- 1. Admin registers and creates a project in Bangalore, India
INSERT INTO countries (name) VALUES ('India');
INSERT INTO states (name, country_id) VALUES ('Karnataka', 1);
INSERT INTO cities (name, state_id) VALUES ('Bangalore', 1);
INSERT INTO locations (address_line_one, address_line_two, city_id, state_id, country_id, postal_code, latitude, longitude)
VALUES ('Metro Station Road', 'Near City Center', 1, 1, 1, '560001', 12.9716, 77.5946);
INSERT INTO users (name, username, email, password_hash, role)
VALUES ('Admin User', 'admin', 'admin@ibcm.com', 'hashed_admin_pw', 'admin');
INSERT INTO projects (name, location, description, start_date, end_date, status, created_by)
VALUES ('Bangalore Metro Phase 2', 1, 'Metro construction in Bangalore', '2024-01-01', '2025-12-31', 'in_progress', 1);

-- 2. Engineer joins and uploads progress images
INSERT INTO users (name, username, email, password_hash, role)
VALUES ('Engineer Ravi', 'ravi', 'ravi@ibcm.com', 'hashed_ravi_pw', 'engineer');
INSERT INTO images (project_id, user_id, image_path, image_type, activity_type, remarks, is_valid)
VALUES (1, 2, 'static/uploads/metro_foundation.jpg', 'progress', 'foundation', 'Foundation work started', 1);
INSERT INTO images (project_id, user_id, image_path, image_type, activity_type, remarks, is_valid)
VALUES (1, 2, 'static/uploads/metro_superstructure.jpg', 'progress', 'super_structure', 'Super structure in progress', 1);

-- 3. PPE detection is run on the images
INSERT INTO ppe_results (image_id, hardhat, mask, no_hardhat, no_mask, no_safety_vest, person, safety_cone, safety_vest, machinery, vehicle)
VALUES (1, 5, 3, 0, 1, 0, 6, 2, 5, 1, 0);
INSERT INTO ppe_results (image_id, hardhat, mask, no_hardhat, no_mask, no_safety_vest, person, safety_cone, safety_vest, machinery, vehicle)
VALUES (2, 4, 2, 1, 0, 1, 5, 1, 4, 0, 1);

-- 4. Image analysis is performed to compare progress
INSERT INTO image_analysis (project_id, previous_image_path, current_image_path, ssim_score, detected_change)
VALUES (1, 'static/uploads/metro_foundation.jpg', 'static/uploads/metro_superstructure.jpg', 0.8123, 'Progressed from foundation to super structure');

-- 5. Progress log is created for the comparison
INSERT INTO progress_logs (project_id, previous_image_id, current_image_id, ssim_score, detected_change)
VALUES (1, 1, 2, 0.8123, 'Foundation to super structure');

-- 6. Auditor joins and reviews the project
INSERT INTO users (name, username, email, password_hash, role)
VALUES ('Auditor Priya', 'priya', 'priya@ibcm.com', 'hashed_priya_pw', 'auditor');

-- 7. Auditor logs an audit action
INSERT INTO audit_logs (user_id, action, details)
VALUES (3, 'REVIEW_PROJECT', 'Reviewed progress and PPE compliance for Bangalore Metro Phase 2');

-- 8. Agency official joins and uploads a safety image
INSERT INTO users (name, username, email, password_hash, role)
VALUES ('Agency Official', 'agency1', 'agency1@ibcm.com', 'hashed_agency_pw', 'agency_official');
INSERT INTO images (project_id, user_id, image_path, image_type, activity_type, remarks, is_valid)
VALUES (1, 4, 'static/uploads/metro_safety.jpg', 'safety', 'facade', 'Safety inspection conducted', 1);

-- 9. PPE detection is run on the safety image
INSERT INTO ppe_results (image_id, hardhat, mask, no_hardhat, no_mask, no_safety_vest, person, safety_cone, safety_vest, machinery, vehicle)
VALUES (3, 6, 4, 0, 0, 0, 7, 3, 6, 1, 0);

-- 10. Audit log for safety image upload
INSERT INTO audit_logs (user_id, action, details)
VALUES (4, 'UPLOAD_IMAGE', 'Uploaded safety inspection image for Bangalore Metro Phase 2');