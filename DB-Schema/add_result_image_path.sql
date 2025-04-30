-- Add result_image_path column to ppe_results table
ALTER TABLE ppe_results 
ADD COLUMN result_image_path TEXT NULL DEFAULT NULL AFTER vehicle;

-- Add index for faster lookups by image_id
CREATE INDEX IF NOT EXISTS idx_ppe_results_result_image ON ppe_results (result_image_path(255));