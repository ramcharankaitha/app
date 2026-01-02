# Fix Internal Server Error for Quotations

## Quick Fix Steps

### 1. Restart Your Server

**If using PM2:**
```bash
cd server
pm2 restart all
pm2 logs
```

**If running directly:**
- Stop the server (Ctrl+C in the terminal)
- Restart: `npm start` or `node server.js`

### 2. Check Server Logs

After restarting, try creating a quotation again and watch the server console. You should see:
- `Creating quotation with data: ...`
- `Inserting quotation with values: ...`

If you see errors, they will show the exact database issue.

### 3. If Error Persists - Fix Database Manually

Connect to your PostgreSQL database:
```bash
psql -U postgres -d anitha_stores
```

Then run these SQL commands:
```sql
-- Make gst_number nullable
ALTER TABLE quotations ALTER COLUMN gst_number DROP NOT NULL;

-- Add customer_name if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE quotations ADD COLUMN customer_name VARCHAR(255);
    UPDATE quotations SET customer_name = 'N/A' WHERE customer_name IS NULL;
    ALTER TABLE quotations ALTER COLUMN customer_name SET NOT NULL;
  END IF;
END $$;

-- Add customer_number if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'customer_number'
  ) THEN
    ALTER TABLE quotations ADD COLUMN customer_number VARCHAR(50);
    UPDATE quotations SET customer_number = 'N/A' WHERE customer_number IS NULL;
    ALTER TABLE quotations ALTER COLUMN customer_number SET NOT NULL;
  END IF;
END $$;

-- Remove quotation_date column
ALTER TABLE quotations DROP COLUMN IF EXISTS quotation_date;
```

### 4. Verify Table Structure

Check that your table has the correct columns:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quotations'
ORDER BY ordinal_position;
```

You should see:
- `customer_name` (NOT NULL)
- `customer_number` (NOT NULL)
- `gst_number` (NULLABLE - this is important!)
- `items` (JSONB)
- `total_price` (NOT NULL)
- `created_at` (TIMESTAMP)
- NO `quotation_date` column

### 5. Test Again

After fixing the database, restart the server and try creating a quotation again.

## What Changed

1. ✅ Removed `quotation_date` requirement - now uses `created_at` automatically
2. ✅ Made `gst_number` optional (nullable)
3. ✅ Added `customer_name` and `customer_number` fields
4. ✅ Added automatic schema migration on insert
5. ✅ Added better error logging

## Still Having Issues?

Check the server console logs for the exact error message. The new code will show:
- The exact database error code
- Which constraint is failing
- Which column is causing the issue

Share the error details from the server console if you need more help.

