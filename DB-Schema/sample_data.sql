INSERT INTO users (name, username, email, password_hash, role)
VALUES 
('Admin User', 'admin1', 'admin@example.com', 'hashed_pw_1', 'admin'),
('Engineer Rahul', 'rahul_eng', 'rahul@example.com', 'hashed_pw_2', 'engineer'),
('Auditor Priya', 'priya_audit', 'priya@example.com', 'hashed_pw_3', 'auditor'),
('ULB Officer Meena', 'meena_ulb', 'meena@example.com', 'hashed_pw_4', 'ulb_official'),
('Agency Head Raj', 'raj_agency', 'raj@example.com', 'hashed_pw_5', 'agency_official');

INSERT INTO locations (address_line1, address_line2, city, state, postal_code, country, latitude, longitude)
VALUES 
('Plot 101', 'Near Main Road', 'Hyderabad', 'Telangana', '500081', 'India', 17.4445, 78.3772),
('Sector 5', 'Tech Street', 'Bengaluru', 'Karnataka', '560100', 'India', 12.9352, 77.6111);

INSERT INTO projects (name, location, description, start_date, end_date, status, created_by)
VALUES 
('IT Tower Project', 1, 'Construction of a 10-floor IT tower in Hyderabad', '2024-10-01', '2025-09-30', 'in_progress', 1),
('Affordable Housing', 2, 'Multi-building housing complex for low-income families', '2024-11-15', '2026-03-31', 'planned', 5);

-- Update images table insert to match new schema (user_id, is_valid, error_message)
INSERT INTO images (project_id, user_id, image_path, activity_type, stage_detected, remarks, is_valid, error_message)
VALUES 
(1, 2, 'https://yourcdn.com/images/img1.jpg', 'foundation', 'foundation', 'Initial excavation work', TRUE, ''),
(1, 2, 'https://yourcdn.com/images/img2.jpg', 'super_structure', 'super_structure', 'Pillars and beams progress', TRUE, ''),
(2, 5, 'https://yourcdn.com/images/img3.jpg', 'foundation', NULL, 'Pending classification', FALSE, 'Stage not detected');

INSERT INTO progress_logs (project_id, previous_image_id, current_image_id, ssim_score, detected_change)
VALUES 
(1, 1, 2, 0.7432, 'Vertical progress from foundation to super structure');

INSERT INTO audit_logs (user_id, action, details)
VALUES 
(1, 'CREATE_PROJECT', 'Created project IT Tower Project'),
(2, 'UPLOAD_IMAGE', 'Uploaded image of foundation stage for project 1'),
(5, 'UPLOAD_IMAGE', 'Uploaded initial image for Affordable Housing project');

-- Sample inserts for ppe_results table
INSERT INTO ppe_results (image_id, Hardhat, Mask, `NO-Hardhat`, `NO-Mask`, `NO-Safety Vest`, Person, `Safety Cone`, `Safety Vest`, machinery, vehicle)
VALUES
(1, 3, 2, 0, 0, 0, 5, 1, 2, 0, 0),
(2, 2, 1, 1, 1, 0, 4, 0, 1, 1, 0),
(3, 0, 0, 2, 2, 1, 3, 0, 0, 0, 1);

-- Sample inserts for image_analysis table
INSERT INTO image_analysis (project_id, previous_image_id, current_image_id, ssim_score, detected_change)
VALUES
(1, 1, 2, 0.7432, 'Vertical progress from foundation to super structure'),
(2, 3, NULL, NULL, NULL);

