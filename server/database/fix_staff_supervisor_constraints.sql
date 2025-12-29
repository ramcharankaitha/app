-- COMPREHENSIVE FIX for Staff and Supervisor Creation
-- Run this script to ensure all database constraints are correct

-- ============================================
-- 1. FIX STAFF TABLE
-- ============================================

-- Make email nullable (remove NOT NULL constraint)
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_email_key;
ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;

-- Ensure phone is NOT NULL and UNIQUE (primary identifier)
DO $$
BEGIN
    -- Make phone NOT NULL if it isn't already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff' AND column_name = 'phone' AND is_nullable = 'YES'
    ) THEN
        -- First, set any NULL phones to a placeholder (you may want to handle this differently)
        UPDATE staff SET phone = 'TEMP_' || id::text WHERE phone IS NULL;
        
        -- Now make it NOT NULL
        ALTER TABLE staff ALTER COLUMN phone SET NOT NULL;
    END IF;
    
    -- Add unique constraint on phone if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'staff' AND constraint_name = 'staff_phone_key'
    ) THEN
        ALTER TABLE staff ADD CONSTRAINT staff_phone_key UNIQUE (phone);
    END IF;
END $$;

-- Ensure role has a default value
ALTER TABLE staff ALTER COLUMN role SET DEFAULT 'STAFF';

-- Ensure created_at has a default
ALTER TABLE staff ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================
-- 2. FIX USERS TABLE (SUPERVISORS)
-- ============================================

-- Make email nullable (remove NOT NULL constraint)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Ensure phone is NOT NULL and UNIQUE (primary identifier)
DO $$
BEGIN
    -- Make phone NOT NULL if it isn't already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'phone' AND is_nullable = 'YES'
    ) THEN
        -- First, set any NULL phones to a placeholder (you may want to handle this differently)
        UPDATE users SET phone = 'TEMP_' || id::text WHERE phone IS NULL;
        
        -- Now make it NOT NULL
        ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
    END IF;
    
    -- Add unique constraint on phone if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'users' AND constraint_name = 'users_phone_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
    END IF;
END $$;

-- Ensure role has a default value
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'SUPERVISOR';

-- Ensure created_at has a default
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================
-- 3. VERIFY CONSTRAINTS
-- ============================================

-- Check staff table constraints
SELECT 
    'staff' as table_name,
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_name = 'staff'
AND column_name IN ('email', 'phone', 'role', 'created_at', 'full_name', 'username', 'password_hash')
ORDER BY column_name;

-- Check users table constraints
SELECT 
    'users' as table_name,
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('email', 'phone', 'role', 'created_at', 'first_name', 'last_name', 'username', 'password_hash')
ORDER BY column_name;

-- Check unique constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('staff', 'users')
AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.table_name, tc.constraint_name;

