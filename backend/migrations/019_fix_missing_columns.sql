-- Migration: Fix missing columns in error_logs and notification_logs
-- Description: Add error_type column to error_logs and payload column to notification_logs
-- Date: December 7, 2025
-- Issue: Backend code expected these columns but they were missing from database

-- Add error_type column to error_logs if it doesn't exist
ALTER TABLE error_logs 
ADD COLUMN IF NOT EXISTS error_type VARCHAR(100);

-- Add payload column to notification_logs if it doesn't exist
ALTER TABLE notification_logs 
ADD COLUMN IF NOT EXISTS payload JSONB;

-- Add comments
COMMENT ON COLUMN error_logs.error_type IS 'Type/category of the error for grouping and filtering';
COMMENT ON COLUMN notification_logs.payload IS 'Full notification payload as JSON for debugging and audit';
