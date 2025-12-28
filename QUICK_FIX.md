# QUICK FIX - Internal Server Error

## The Problem
The database has `email VARCHAR(255) UNIQUE NOT NULL` constraint, but we're inserting NULL values.

## The Solution (Run This Now!)

**Copy and paste this SQL into your database:**

```sql
-- Fix customers table
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;

-- Fix users table (SUPERVISORS) - CRITICAL!
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
```

**That's it!** This will fix the internal server errors for both customers and supervisors.

## Test It
After running the SQL, try creating a customer without email. It should work!

## If Still Getting Errors

Check your server console logs - they now show detailed error information including:
- Error code
- Column name
- Constraint name

This will help identify any other issues.

