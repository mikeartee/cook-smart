-- Migration: Allow multiple recipes per meal slot
-- This removes the unique constraint that limited one recipe per meal

-- Drop the unique constraint
ALTER TABLE meal_plans DROP CONSTRAINT IF EXISTS meal_plans_user_id_planned_date_meal_type_key;

-- Add a composite index for better query performance
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date_meal ON meal_plans(user_id, planned_date, meal_type);
