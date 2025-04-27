-- Add QR code column to training records
ALTER TABLE training_records
ADD COLUMN qr_code TEXT; 