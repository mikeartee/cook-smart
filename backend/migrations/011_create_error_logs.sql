-- Migration: Create error logs table
-- Description: Track application errors for monitoring and debugging

CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  error_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  user_id INTEGER,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by INTEGER,
  resolved_at TIMESTAMP,
  auto_repaired BOOLEAN DEFAULT FALSE,
  repair_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys
ALTER TABLE error_logs
ADD CONSTRAINT fk_error_logs_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE error_logs
ADD CONSTRAINT fk_error_logs_resolved_by
FOREIGN KEY (resolved_by) REFERENCES admin_users(id) ON DELETE SET NULL;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);

-- Add comments
COMMENT ON TABLE error_logs IS 'Application error tracking and monitoring';
COMMENT ON COLUMN error_logs.severity IS 'Error severity: critical, high, medium, or low';
COMMENT ON COLUMN error_logs.auto_repaired IS 'Whether the error was automatically repaired';
COMMENT ON COLUMN error_logs.repair_attempts IS 'Number of auto-repair attempts';
