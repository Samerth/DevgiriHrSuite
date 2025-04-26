ALTER TABLE training_records ADD COLUMN IF NOT EXISTS attendees text[] DEFAULT '{}';
