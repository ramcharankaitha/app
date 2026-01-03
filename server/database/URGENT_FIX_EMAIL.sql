-- URGENT FIX: Make email optional on hosted server
-- Run this SQL immediately on your hosted database

-- Fix staff table
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_email_key;
ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;

-- Fix users table (supervisors)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Fix customers table
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;

-- Fix suppliers table (if exists)
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

-- Verify
SELECT 
    table_name,
    column_name,
    is_nullable
FROM information_schema.columns
WHERE column_name = 'email'
AND table_schema = 'public'
ORDER BY table_name;

