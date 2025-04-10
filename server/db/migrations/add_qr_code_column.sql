-- Add qr_code column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE; 