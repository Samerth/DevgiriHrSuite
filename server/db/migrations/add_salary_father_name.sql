
-- Add salary and father_name columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS father_name TEXT;
