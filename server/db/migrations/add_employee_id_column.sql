-- Add employee_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE; 