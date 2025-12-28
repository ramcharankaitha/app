# URGENT: Database Fix for Internal Server Errors

## Problem
Internal server errors are occurring when creating records because the `email` field in the `customers` table has a `NOT NULL` constraint, but we're trying to insert `NULL` values.

## Solution

### Step 1: Run the Database Migration

**IMPORTANT: Run this SQL script on your database immediately:**

```sql
-- Fix Email Constraints - Make email nullable across all tables

-- 1. Fix customers table
-- Drop the unique constraint on email first
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;

-- Make email nullable
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;

-- 2. Fix staff table (if email has NOT NULL constraint)
DO $$ 
BEGIN
    -- Check if email column exists and has NOT NULL constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'email'
    ) THEN
        -- Drop unique constraint if exists
        ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_email_key;
        -- Make nullable
        ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;
    END IF;
END $$;

-- 3. Fix suppliers table (if email column exists)
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

### Step 2: Verify the Fix

After running the migration, test creating:
- A customer (without email)
- A staff member
- A supplier
- A product
- A category

### Step 3: Check Server Logs

If errors persist, check the server console logs. The improved error handling will now show:
- Error code
- Error message
- Constraint name (if applicable)
- Column name (if applicable)

## Files Modified

1. **server/routes/customers.js** - Removed email requirement, improved error handling
2. **server/routes/products.js** - Improved error handling
3. **server/routes/staff.js** - Improved error handling
4. **server/routes/suppliers.js** - Improved error handling
5. **server/routes/categories.js** - Improved error handling
6. **server/routes/purchaseOrders.js** - Improved error handling

## Quick Test

After running the migration, try creating a customer with:
- Name: "Test Customer"
- Phone: "1234567890"
- (No email required)

If it works, the fix is successful!

## If Errors Persist

1. Check server console for detailed error messages
2. Verify database connection
3. Check if all required columns exist in tables
4. Review the error details in the response (in development mode)

