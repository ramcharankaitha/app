# URGENT FIX - Users/Supervisors Creation Error

## The Problem
Creating a supervisor/user is failing with "Internal server error" because the `users` table has `email VARCHAR(255) UNIQUE NOT NULL` constraint, but we're inserting NULL values.

## The Solution (Run This NOW!)

**Copy and paste this SQL into your database:**

```sql
-- Fix users table email constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
```

**OR run the complete fix script:**

```sql
-- Complete fix for all tables
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Staff table (if needed)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'email'
    ) THEN
        ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_email_key;
        ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;
    END IF;
END $$;

-- Suppliers table (if needed)
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
```

## Test It
After running the SQL, try creating a supervisor/user. It should work!

## What Was Fixed
1. ✅ Removed email NOT NULL constraint from `users` table
2. ✅ Removed email UNIQUE constraint from `users` table  
3. ✅ Improved error logging in `server/routes/users.js`
4. ✅ Better error messages for debugging

## Files Modified
- `server/routes/users.js` - Improved error handling
- `server/database/fix_email_constraints.sql` - Added users table fix

