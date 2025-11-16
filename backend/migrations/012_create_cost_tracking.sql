-- Migration: Create cost tracking table
-- Description: Track monthly service costs for budget monitoring

CREATE TABLE IF NOT EXISTS cost_tracking (
  id SERIAL PRIMARY KEY,
  month DATE NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(month, service_name)
);

CREATE INDEX IF NOT EXISTS idx_cost_tracking_month ON cost_tracking(month DESC);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_service ON cost_tracking(service_name);

COMMENT ON TABLE cost_tracking IS 'Monthly service cost tracking for budget monitoring';
COMMENT ON COLUMN cost_tracking.month IS 'First day of the month for this cost entry';
