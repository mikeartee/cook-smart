-- Admin System Database Schema
-- This migration creates tables for the admin dashboard system

-- Table: admin_users
-- Stores admin user accounts with authentication details
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  is_super_admin BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for admin_users
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_verification_token ON admin_users(verification_token);
CREATE INDEX idx_admin_users_reset_token ON admin_users(reset_token);

-- Table: approved_admin_emails
-- Whitelist of emails approved for admin access
CREATE TABLE IF NOT EXISTS approved_admin_emails (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  added_by INTEGER REFERENCES admin_users(id),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for approved_admin_emails
CREATE INDEX idx_approved_admin_emails_email ON approved_admin_emails(email);

-- Table: admin_activity_logs
-- Tracks admin login/logout activity
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admin_users(id),
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for admin_activity_logs
CREATE INDEX idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);
CREATE INDEX idx_admin_activity_logs_action ON admin_activity_logs(action);
CREATE INDEX idx_admin_activity_logs_success ON admin_activity_logs(success);

-- Table: admin_audit_logs
-- Tracks all admin actions on resources
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admin_users(id),
  action_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INTEGER,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for admin_audit_logs
CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX idx_admin_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX idx_admin_audit_logs_action_type ON admin_audit_logs(action_type);

-- Insert initial super admin email
INSERT INTO approved_admin_emails (email, is_super_admin, added_by, added_at) 
VALUES ('tootallgames2020@gmail.com', TRUE, NULL, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Add comment to document the super admin email
COMMENT ON TABLE approved_admin_emails IS 'Whitelist of emails approved for admin dashboard access';
COMMENT ON COLUMN approved_admin_emails.is_super_admin IS 'Super admins can manage other admins and approved emails';
COMMENT ON TABLE admin_users IS 'Admin user accounts for dashboard access';
COMMENT ON TABLE admin_activity_logs IS 'Tracks admin authentication events (login, logout, failed attempts)';
COMMENT ON TABLE admin_audit_logs IS 'Tracks admin actions on resources (user management, subscriptions, etc.)';
