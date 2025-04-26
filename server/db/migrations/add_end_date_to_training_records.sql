-- Add end_date column to training_records table
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS end_date DATE;

-- Update existing records to set end_date equal to date
UPDATE training_records SET end_date = date WHERE end_date IS NULL;

-- Make end_date not null after setting default values
ALTER TABLE training_records ALTER COLUMN end_date SET NOT NULL; 