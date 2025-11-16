-- Create notification_logs table for tracking Discord notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('error', 'feedback', 'activity', 'health')),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('error', 'feedback', 'activity')),
  payload JSONB NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_success ON notification_logs(success);

-- Create function to auto-delete logs older than 30 days
CREATE OR REPLACE FUNCTION delete_old_notification_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_logs WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to run cleanup (requires pg_cron extension)
-- If pg_cron is not available, run this manually or via cron job
-- SELECT cron.schedule('delete-old-notification-logs', '0 2 * * *', 'SELECT delete_old_notification_logs()');

-- Add comment
COMMENT ON TABLE notification_logs IS 'Tracks all Discord notifications sent by the system';
COMMENT ON FUNCTION delete_old_notification_logs() IS 'Deletes notification logs older than 30 days to save storage';
