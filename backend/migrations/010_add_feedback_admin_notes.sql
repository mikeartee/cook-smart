-- Migration: Add admin notes to feedback table
-- Description: Allow admins to add internal notes to feedback items

-- Add admin_notes column to feedback table
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_id INTEGER,
ADD COLUMN IF NOT EXISTS notes_updated_at TIMESTAMP;

-- Add foreign key to admin_users
ALTER TABLE feedback
ADD CONSTRAINT fk_feedback_admin
FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_admin_id ON feedback(admin_id);

-- Add comments
COMMENT ON COLUMN feedback.admin_notes IS 'Internal notes added by admin';
COMMENT ON COLUMN feedback.admin_id IS 'Admin who last updated the notes';
COMMENT ON COLUMN feedback.notes_updated_at IS 'When notes were last updated';
