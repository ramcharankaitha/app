-- Make Email and Last Name Optional in Database
-- Run this script to ensure email and last_name are truly optional (no NOT NULL constraint)

-- Fix users table (SUPERVISORS)
-- Make email optional
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Make last_name optional (supervisor name might be single word)
ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL;

-- Fix staff table
-- Make email optional
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_email_key;
ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;

-- Verify the changes
SELECT 
    table_name,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('users', 'staff')
AND column_name IN ('email', 'last_name')
ORDER BY table_name, column_name;

-- Expected result: is_nullable should be 'YES' for email and last_name in users table
-- Expected result: is_nullable should be 'YES' for email in staff table

