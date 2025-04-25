-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema ibcm
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `ibcm` ;

-- -----------------------------------------------------
-- Schema ibcm
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `ibcm` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
SHOW WARNINGS;
USE `ibcm` ;

-- -----------------------------------------------------
-- Table `ibcm`.`users`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ibcm`.`users` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `ibcm`.`users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password_hash` TEXT NOT NULL,
  `role` ENUM('admin', 'engineer', 'auditor', 'ulb_official', 'agency_official') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`));

SHOW WARNINGS;
CREATE UNIQUE INDEX `idx_user_username` ON `ibcm`.`users` (`username` ASC) VISIBLE;

SHOW WARNINGS;
CREATE UNIQUE INDEX `idx_user_email` ON `ibcm`.`users` (`email` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `ibcm`.`countries`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ibcm`.`countries` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `ibcm`.`countries` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`));

SHOW WARNINGS;
CREATE UNIQUE INDEX `idx_countries_name` ON `ibcm`.`countries` (`name` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `ibcm`.`states`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ibcm`.`states` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `ibcm`.`states` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `country_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_states_country`
    FOREIGN KEY (`country_id`)
    REFERENCES `ibcm`.`countries` (`id`));

SHOW WARNINGS;
CREATE INDEX `idx_states_country_id` ON `ibcm`.`states` (`country_id` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `ibcm`.`cities`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ibcm`.`cities` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `ibcm`.`cities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `state_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_cities_states`
    FOREIGN KEY (`state_id`)
    REFERENCES `ibcm`.`states` (`id`));

SHOW WARNINGS;
CREATE INDEX `idx_cities_state_id` ON `ibcm`.`cities` (`state_id` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `ibcm`.`locations`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ibcm`.`locations` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `ibcm`.`locations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `address_line_one` VARCHAR(150) NULL DEFAULT NULL,
  `address_line_two` VARCHAR(150) NULL DEFAULT NULL,
  `city_id` INT NULL DEFAULT NULL,
  `state_id` INT NULL DEFAULT NULL,
  `country_id` INT NULL DEFAULT NULL,
  `postal_code` VARCHAR(20) NULL DEFAULT NULL,
  `latitude` DECIMAL(10,8) NULL DEFAULT NULL,
  `longitude` DECIMAL(11,8) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_location_cities`
    FOREIGN KEY (`city_id`)
    REFERENCES `ibcm`.`cities` (`id`),
  CONSTRAINT `fk_location_states`
    FOREIGN KEY (`state_id`)
    REFERENCES `ibcm`.`states` (`id`),
  CONSTRAINT `fk_location_countries`
    FOREIGN KEY (`country_id`)
    REFERENCES `ibcm`.`countries` (`id`));

SHOW WARNINGS;
CREATE INDEX `idx_location_city_id` ON `ibcm`.`locations` (`city_id` ASC) VISIBLE;

SHOW WARNINGS;
CREATE INDEX `idx_location_state_id` ON `ibcm`.`locations` (`state_id` ASC) VISIBLE;

SHOW WARNINGS;
CREATE INDEX `idx_location_country_id` ON `ibcm`.`locations` (`country_id` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `ibcm`.`projects`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ibcm`.`projects` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `ibcm`.`projects` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `location` INT NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `start_date` DATE NULL DEFAULT NULL,
  `end_date` DATE NULL DEFAULT NULL,
  `status` ENUM('planned', 'in_progress', 'completed', 'on_hold') NULL DEFAULT 'planned',
  `created_by` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_projects_users`
    FOREIGN KEY (`created_by`)
    REFERENCES `ibcm`.`users` (`id`),
  CONSTRAINT `fk_projects_locations`
    FOREIGN KEY (`location`)
    REFERENCES `ibcm`.`locations` (`id`));

SHOW WARNINGS;
CREATE INDEX `idx_projects_created_by` ON `ibcm`.`projects` (`created_by` ASC) VISIBLE;

SHOW WARNINGS;
CREATE INDEX `idx_projects_location` ON `ibcm`.`projects` (`location` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `ibcm`.`images`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ibcm`.`images` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `ibcm`.`images` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `project_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `image_path` TEXT NOT NULL,
  `image_type` ENUM('progress', 'safety') NOT NULL,
  `activity_type` ENUM('foundation', 'super_structure', 'facade', 'interiors', 'finishing') NOT NULL,
  `remarks` TEXT NULL DEFAULT NULL,
  `is_valid` TINYINT NULL DEFAULT TRUE,
  `error_message` TEXT NULL DEFAULT NULL,
  `uploaded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_images_projects`
    FOREIGN KEY (`project_id`)
    REFERENCES `ibcm`.`projects` (`id`),
  CONSTRAINT `fk_images_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `ibcm`.`users` (`id`));

SHOW WARNINGS;
CREATE INDEX `idx_images_project_id` ON `ibcm`.`images` (`project_id` ASC) VISIBLE;

SHOW WARNINGS;
CREATE INDEX `fk_images_users` ON `ibcm`.`images` (`user_id` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `ibcm`.`image_analysis`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ibcm`.`image_analysis` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `ibcm`.`image_analysis` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `project_id` INT NOT NULL,
  `previous_image_path` TEXT NOT NULL,
  `current_image_path` TEXT NOT NULL,
  `ssim_score` DECIMAL(5,4) NULL DEFAULT NULL,
  `detected_change` TEXT NULL DEFAULT NULL,
  `analysis_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_image_analysis_projects`
    FOREIGN KEY (`project_id`)
    REFERENCES `ibcm`.`projects` (`id`));

SHOW WARNINGS;
CREATE INDEX `idx_image_analysis_project_id` ON `ibcm`.`image_analysis` (`project_id` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `ibcm`.`ppe_results`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ibcm`.`ppe_results` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `ibcm`.`ppe_results` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `image_id` INT NOT NULL,
  `detection_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `hardhat` INT NULL DEFAULT 0,
  `mask` INT NULL DEFAULT 0,
  `no_hardhat` INT NULL DEFAULT 0,
  `no_mask` INT NULL DEFAULT 0,
  `no_safety_vest` INT NULL DEFAULT 0,
  `person` INT NULL DEFAULT 0,
  `safety_cone` INT NULL DEFAULT 0,
  `safety_vest` INT NULL DEFAULT 0,
  `machinery` INT NULL DEFAULT 0,
  `vehicle` INT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ppe_results_images`
    FOREIGN KEY (`image_id`)
    REFERENCES `ibcm`.`images` (`id`));

SHOW WARNINGS;
CREATE INDEX `idx_ppe_results_image_id` ON `ibcm`.`ppe_results` (`image_id` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `ibcm`.`progress_logs`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ibcm`.`progress_logs` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `ibcm`.`progress_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `project_id` INT NOT NULL,
  `previous_image_id` INT NULL DEFAULT NULL,
  `current_image_id` INT NULL DEFAULT NULL,
  `ssim_score` DECIMAL(5,4) NULL DEFAULT NULL,
  `detected_change` TEXT NULL DEFAULT NULL,
  `log_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_progress_logs_projects`
    FOREIGN KEY (`project_id`)
    REFERENCES `ibcm`.`projects` (`id`),
  CONSTRAINT `fk_progress_logs_previous_image`
    FOREIGN KEY (`previous_image_id`)
    REFERENCES `ibcm`.`images` (`id`),
  CONSTRAINT `fk_progress_logs_current_image`
    FOREIGN KEY (`current_image_id`)
    REFERENCES `ibcm`.`images` (`id`));

SHOW WARNINGS;
CREATE INDEX `idx_progress_log_project_id` ON `ibcm`.`progress_logs` (`project_id` ASC) VISIBLE;

SHOW WARNINGS;
CREATE INDEX `idx_progress_log_previous_image_id` ON `ibcm`.`progress_logs` (`previous_image_id` ASC) VISIBLE;

SHOW WARNINGS;
CREATE INDEX `idx_progress_log_current_image_id` ON `ibcm`.`progress_logs` (`current_image_id` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `ibcm`.`audit_logs`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ibcm`.`audit_logs` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `ibcm`.`audit_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT NULL DEFAULT NULL,
  `action_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sudit_logs_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `ibcm`.`users` (`id`));

SHOW WARNINGS;
CREATE INDEX `idx_audit_log_user_id` ON `ibcm`.`audit_logs` (`user_id` ASC) VISIBLE;

SHOW WARNINGS;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
