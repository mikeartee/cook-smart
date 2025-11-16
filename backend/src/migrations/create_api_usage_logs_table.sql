-- Create API Usage Logs Table
-- Tracks all external API calls for monitoring and analytics

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT true,
  cached BOOLEAN NOT NULL DEFAULT false,
  response_time INTEGER NOT NULL, -- in milliseconds
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_provider ON api_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_timestamp ON api_usage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_provider_timestamp ON api_usage_logs(provider, timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_success ON api_usage_logs(success);

-- Add comment
COMMENT ON TABLE api_usage_logs IS 'Tracks all external recipe API calls for monitoring and rate limit management';
