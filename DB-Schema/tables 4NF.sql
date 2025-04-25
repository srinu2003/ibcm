-- -----------------------------------------------------
-- Schema ibcm
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `ibcm` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `ibcm` ;

-- Your schema is already in BCNF. No changes required.
-- Your schema is already in 4NF. No changes required.

-- Users table using ENUM for role (no separate roles table)
CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role ENUM('admin', 'engineer', 'auditor', 'ulb_official', 'agency_official') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Countries table
CREATE TABLE countries (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- States table
CREATE TABLE states (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country_id INT NOT NULL,
    FOREIGN KEY (country_id) REFERENCES countries(id)
);

-- Cities table
CREATE TABLE cities (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_id INT NOT NULL,
    FOREIGN KEY (state_id) REFERENCES states(id)
);

-- Location table (now references city, state, country)
CREATE TABLE locations (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    address_line_one VARCHAR(150),
    address_line_two VARCHAR(150),
    city_id INT,
    state_id INT,
    country_id INT,
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (state_id) REFERENCES states(id),
    FOREIGN KEY (country_id) REFERENCES countries(id)
);

-- Images table (stores metadata and file path, validation status, error message)
CREATE TABLE images (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    image_path TEXT NOT NULL,
    image_type ENUM('progress', 'safety') NOT NULL, -- distinguishes use case
    activity_type ENUM('foundation', 'super_structure', 'facade', 'interiors', 'finishing') NOT NULL,
    remarks TEXT DEFAULT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    error_message TEXT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Image Analysis table (stores SSIM and other analysis results for each image pair)
CREATE TABLE image_analysis (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    previous_image_path TEXT NOT NULL,
    current_image_path TEXT NOT NULL,
    ssim_score DECIMAL(5,4),
    detected_change TEXT,
    analysis_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- PPE Results table (stores PPE detection results for each image)
CREATE TABLE ppe_results (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    image_id INT NOT NULL, -- links to images table
    detection_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hardhat INT DEFAULT 0,
    mask INT DEFAULT 0,
    no_hardhat INT DEFAULT 0,
    no_mask INT DEFAULT 0,
    no_safety_vest INT DEFAULT 0,
    person INT DEFAULT 0,
    safety_cone INT DEFAULT 0,
    safety_vest INT DEFAULT 0,
    machinery INT DEFAULT 0,
    vehicle INT DEFAULT 0,
    FOREIGN KEY (image_id) REFERENCES images(id)
);

-- Projects table
CREATE TABLE projects (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location INT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status ENUM('planned', 'in_progress', 'completed', 'on_hold') DEFAULT 'planned',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (location) REFERENCES locations(id)
);

-- Progress Logs table (for SSIM comparisons)
CREATE TABLE progress_logs (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    previous_image_id INT,
    current_image_id INT,
    ssim_score DECIMAL(5,4),
    detected_change TEXT,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (previous_image_id) REFERENCES images(id),
    FOREIGN KEY (current_image_id) REFERENCES images(id)
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
