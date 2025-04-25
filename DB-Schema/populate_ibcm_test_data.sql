-- Populate countries
INSERT INTO countries (name) VALUES ('India'), ('USA');

-- Populate states
INSERT INTO states (name, country_id) VALUES 
('Karnataka', 1), 
('Maharashtra', 1), 
('California', 2);

-- Populate cities
INSERT INTO cities (name, state_id) VALUES 
('Bangalore', 1), 
('Mumbai', 2), 
('San Francisco', 3);

-- Populate locations
INSERT INTO locations (address_line_one, address_line_two, city_id, state_id, country_id, postal_code, latitude, longitude)
VALUES
('123 Main St', 'Near Park', 1, 1, 1, '560001', 12.9716, 77.5946),
('456 Market Rd', NULL, 2, 2, 1, '400001', 19.0760, 72.8777),
('789 Bay Area', NULL, 3, 3, 2, '94103', 37.7749, -122.4194);

-- Populate users
INSERT INTO users (name, username, email, password_hash, role)
VALUES
('Admin User', 'admin', 'admin@example.com', 'hashed_pw1', 'admin'),
('Engineer One', 'eng1', 'eng1@example.com', 'hashed_pw2', 'engineer'),
('Auditor One', 'aud1', 'aud1@example.com', 'hashed_pw3', 'auditor');

-- Populate projects
INSERT INTO projects (name, location, description, start_date, end_date, status, created_by)
VALUES
('Metro Construction', 1, 'Metro rail project', '2024-01-01', '2025-12-31', 'in_progress', 1),
('Bridge Renovation', 2, 'Renovation of old bridge', '2023-06-01', '2024-06-30', 'planned', 2);

-- Populate images
INSERT INTO images (project_id, user_id, image_path, image_type, activity_type, remarks, is_valid)
VALUES
(1, 2, 'static/uploads/metro1.jpg', 'progress', 'foundation', 'Initial foundation work', 1),
(1, 2, 'static/uploads/metro2.jpg', 'progress', 'super_structure', 'Super structure update', 1),
(2, 3, 'static/uploads/bridge1.jpg', 'safety', 'facade', 'Safety inspection', 1);

-- Populate image_analysis
INSERT INTO image_analysis (project_id, previous_image_path, current_image_path, ssim_score, detected_change)
VALUES
(1, 'static/uploads/metro1.jpg', 'static/uploads/metro2.jpg', 0.8765, 'Progressed to super structure');

-- Populate ppe_results
INSERT INTO ppe_results (image_id, hardhat, mask, no_hardhat, no_mask, no_safety_vest, person, safety_cone, safety_vest, machinery, vehicle)
VALUES
(1, 5, 3, 0, 1, 0, 6, 2, 5, 1, 0),
(2, 4, 2, 1, 0, 1, 5, 1, 4, 0, 1);

-- Populate progress_logs
INSERT INTO progress_logs (project_id, previous_image_id, current_image_id, ssim_score, detected_change)
VALUES
(1, 1, 2, 0.8765, 'Foundation to super structure');

-- Populate audit_logs
INSERT INTO audit_logs (user_id, action, details)
VALUES
(1, 'CREATE_PROJECT', 'Created project Metro Construction'),
(2, 'UPLOAD_IMAGE', 'Uploaded image metro1.jpg');