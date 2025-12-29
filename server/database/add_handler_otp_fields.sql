-- Add OTP and completion fields to services table
-- Run this SQL script to add the necessary columns for handler OTP functionality

-- Add OTP code column
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);

-- Add OTP expiry timestamp
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;

-- Add OTP sent timestamp
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS otp_sent_at TIMESTAMP;

-- Add service completion status
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Add service completion timestamp
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Add index on handler_name for faster queries
CREATE INDEX IF NOT EXISTS idx_services_handler_name ON services(LOWER(TRIM(handler_name)));

-- Add index on is_completed for faster filtering
CREATE INDEX IF NOT EXISTS idx_services_is_completed ON services(is_completed);

