-- Create error logs table for tracking application errors

CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  stack TEXT,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  endpoint VARCHAR(255),
  user_id VARCHAR(255),
  request_body TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(255)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);

-- Verify table created
SELECT 'error_logs table created' as status, COUNT(*) as record_count FROM error_logs;
