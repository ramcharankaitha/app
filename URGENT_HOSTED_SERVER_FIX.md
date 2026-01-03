# URGENT: Fix Email Constraint on Hosted Server

## Problem
Staff creation works locally but fails on hosted server with "email field missing" error.

## IMMEDIATE FIX (Run this SQL on your hosted database NOW):

```sql
-- Copy and paste this into your hosted database (Railway/Render/etc.)

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_email_key;
ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;
```

## How to Run:

### Option 1: Railway/Render Database Console
1. Go to your hosting dashboard
2. Open database console/query editor
3. Paste the SQL above
4. Run it

### Option 2: Using psql (if you have access)
```bash
psql $DATABASE_URL -f server/database/URGENT_FIX_EMAIL.sql
```

### Option 3: Using pgAdmin
1. Connect to your hosted database
2. Open Query Tool
3. Paste the SQL
4. Execute

## What Was Fixed in Code:

✅ Removed email from all INSERT statements
✅ Added automatic migration that runs on server start
✅ Added retry logic if constraint error occurs
✅ Updated error handlers

## After Running SQL:

1. Restart your server
2. The automatic migration will also run as backup
3. Try creating staff - should work without email

## Verification:

Run this to verify:
```sql
SELECT table_name, column_name, is_nullable 
FROM information_schema.columns 
WHERE column_name = 'email' AND table_schema = 'public';
```

All `is_nullable` should be `YES`.

