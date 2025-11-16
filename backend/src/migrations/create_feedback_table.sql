-- Create feedback table for storing user feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  category VARCHAR(50),
  message TEXT NOT NULL,
  screenshot_url TEXT,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'in_progress', 'resolved', 'ignored')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- Add comment
COMMENT ON TABLE feedback IS 'Stores user feedback submissions from the mobile app';
