-- Fix Email Constraints - Make email nullable across all tables
-- Run this script on your database to fix internal server errors

-- 1. Fix customers table
-- Drop the unique constraint on email first
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;

-- Make email nullable
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;

-- 2. Fix users table (SUPERVISORS) - CRITICAL FIX
-- Drop the unique constraint on email first
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Make email nullable
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- 3. Fix staff table - CRITICAL FIX
-- Drop the unique constraint on email first
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_email_key;

-- Make email nullable
ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;

-- 4. Fix suppliers table (if email column exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' AND column_name = 'email'
    ) THEN
        ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_email_key;
        ALTER TABLE suppliers ALTER COLUMN email DROP NOT NULL;
    END IF;
END $$;

-- Note: This script is safe to run multiple times
-- It will only modify constraints if they exist

