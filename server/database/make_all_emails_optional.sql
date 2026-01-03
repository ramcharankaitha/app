-- Make ALL email fields optional across the entire database
-- This script removes NOT NULL constraints and UNIQUE constraints on email columns
-- Run this script to ensure email is never required anywhere

-- 1. Fix users table (Supervisors)
DO $$ 
BEGIN
    -- Drop unique constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name = 'users_email_key'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_email_key;
        RAISE NOTICE 'Dropped users_email_key constraint';
    END IF;
    
    -- Make email nullable
    ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
    RAISE NOTICE 'Made users.email nullable';
END $$;

-- 2. Fix staff table
DO $$ 
BEGIN
    -- Drop unique constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'staff' 
        AND constraint_name = 'staff_email_key'
    ) THEN
        ALTER TABLE staff DROP CONSTRAINT staff_email_key;
        RAISE NOTICE 'Dropped staff_email_key constraint';
    END IF;
    
    -- Make email nullable
    ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;
    RAISE NOTICE 'Made staff.email nullable';
END $$;

-- 3. Fix customers table
DO $$ 
BEGIN
    -- Drop unique constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'customers' 
        AND constraint_name = 'customers_email_key'
    ) THEN
        ALTER TABLE customers DROP CONSTRAINT customers_email_key;
        RAISE NOTICE 'Dropped customers_email_key constraint';
    END IF;
    
    -- Make email nullable
    ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;
    RAISE NOTICE 'Made customers.email nullable';
END $$;

-- 4. Fix suppliers table (if exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' AND column_name = 'email'
    ) THEN
        -- Drop unique constraint if exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'suppliers' 
            AND constraint_name = 'suppliers_email_key'
        ) THEN
            ALTER TABLE suppliers DROP CONSTRAINT suppliers_email_key;
            RAISE NOTICE 'Dropped suppliers_email_key constraint';
        END IF;
        
        -- Make email nullable
        ALTER TABLE suppliers ALTER COLUMN email DROP NOT NULL;
        RAISE NOTICE 'Made suppliers.email nullable';
    END IF;
END $$;

-- 5. Verify all email columns are now nullable
SELECT 
    table_name,
    column_name,
    is_nullable,
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ Optional'
        ELSE '❌ Required'
    END as status
FROM information_schema.columns
WHERE column_name = 'email'
AND table_schema = 'public'
ORDER BY table_name;

-- Expected result: All email columns should show is_nullable = 'YES'

