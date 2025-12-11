-- Create missing tables for full admin dashboard functionality
-- Run this migration to enable all admin features

-- Feature Usage Table
CREATE TABLE IF NOT EXISTS feature_usage (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Health Table
CREATE TABLE IF NOT EXISTS system_health (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(20),
    status VARCHAR(20) DEFAULT 'healthy', -- healthy, warning, critical
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);

-- Cache Metrics Table
CREATE TABLE IF NOT EXISTS cache_metrics (
    id SERIAL PRIMARY KEY,
    cache_name VARCHAR(100) NOT NULL,
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    size_bytes BIGINT DEFAULT 0,
    entry_count INTEGER DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_name ON feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_last_used ON feature_usage(last_used_at);

CREATE INDEX IF NOT EXISTS idx_system_health_metric_name ON system_health(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_health_recorded_at ON system_health(recorded_at);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health(status);

CREATE INDEX IF NOT EXISTS idx_cache_metrics_cache_name ON cache_metrics(cache_name);
CREATE INDEX IF NOT EXISTS idx_cache_metrics_recorded_at ON cache_metrics(recorded_at);

-- Insert some sample data for testing
INSERT INTO feature_usage (user_id, feature_name, usage_count, last_used_at) 
SELECT 
    u.id,
    'recipe_search',
    FLOOR(RANDOM() * 50) + 1,
    CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '30 days')
FROM users u 
LIMIT 10
ON CONFLICT DO NOTHING;

INSERT INTO feature_usage (user_id, feature_name, usage_count, last_used_at) 
SELECT 
    u.id,
    'meal_planning',
    FLOOR(RANDOM() * 20) + 1,
    CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '30 days')
FROM users u 
LIMIT 10
ON CONFLICT DO NOTHING;

INSERT INTO system_health (metric_name, metric_value, metric_unit, status) VALUES
('cpu_usage', 45.2, 'percent', 'healthy'),
('memory_usage', 68.5, 'percent', 'healthy'),
('disk_usage', 32.1, 'percent', 'healthy'),
('database_connections', 15, 'count', 'healthy'),
('api_response_time', 120, 'milliseconds', 'healthy');

INSERT INTO cache_metrics (cache_name, hit_count, miss_count, size_bytes, entry_count) VALUES
('recipe_cache', 1250, 180, 2048576, 450),
('user_session_cache', 890, 45, 512000, 120),
('analytics_cache', 340, 25, 256000, 85);

-- Update timestamps
UPDATE feature_usage SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

COMMIT;