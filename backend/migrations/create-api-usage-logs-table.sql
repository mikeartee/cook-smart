-- Create API usage logs table for monitoring external API calls
-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS api_usage_logs CASCADE;

CREATE TABLE api_usage_logs (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT true,
  cached BOOLEAN NOT NULL DEFAULT false,
  response_time INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_api_usage_provider ON api_usage_logs(provider);
CREATE INDEX idx_api_usage_timestamp ON api_usage_logs(timestamp DESC);
CREATE INDEX idx_api_usage_success ON api_usage_logs(success);
CREATE INDEX idx_api_usage_provider_date ON api_usage_logs(provider, timestamp);

-- Verify table created
SELECT 'api_usage_logs table created' as status, COUNT(*) as record_count FROM api_usage_logs;
