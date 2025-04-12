-- Update training_records table to use a single date column
ALTER TABLE training_records ADD COLUMN date DATE;
UPDATE training_records SET date = start_date;
ALTER TABLE training_records DROP COLUMN start_date;
ALTER TABLE training_records DROP COLUMN end_date;
ALTER TABLE training_records ALTER COLUMN date SET NOT NULL; 