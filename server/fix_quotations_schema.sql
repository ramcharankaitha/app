-- ============================================
-- FIX QUOTATIONS TABLE SCHEMA
-- ============================================
-- Run this SQL script directly in your PostgreSQL database
-- to fix the quotations table schema
--
-- Usage:
--   psql -U postgres -d anitha_stores -f server/fix_quotations_schema.sql
--   OR copy and paste into pgAdmin or psql
-- ============================================

-- Step 1: Make gst_number nullable (remove NOT NULL constraint)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' 
    AND column_name = 'gst_number' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE quotations ALTER COLUMN gst_number DROP NOT NULL;
    RAISE NOTICE '✅ Made gst_number nullable';
  ELSE
    RAISE NOTICE 'ℹ️  gst_number is already nullable or does not exist';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Error making gst_number nullable: %', SQLERRM;
END $$;

-- Step 2: Add customer_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE quotations ADD COLUMN customer_name VARCHAR(255);
    UPDATE quotations SET customer_name = 'N/A' WHERE customer_name IS NULL;
    ALTER TABLE quotations ALTER COLUMN customer_name SET NOT NULL;
    RAISE NOTICE '✅ Added customer_name column';
  ELSE
    RAISE NOTICE 'ℹ️  customer_name column already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Error adding customer_name: %', SQLERRM;
END $$;

-- Step 3: Add customer_number column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'customer_number'
  ) THEN
    ALTER TABLE quotations ADD COLUMN customer_number VARCHAR(50);
    UPDATE quotations SET customer_number = 'N/A' WHERE customer_number IS NULL;
    ALTER TABLE quotations ALTER COLUMN customer_number SET NOT NULL;
    RAISE NOTICE '✅ Added customer_number column';
  ELSE
    RAISE NOTICE 'ℹ️  customer_number column already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Error adding customer_number: %', SQLERRM;
END $$;

-- Step 4: Remove quotation_date column (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'quotation_date'
  ) THEN
    ALTER TABLE quotations DROP COLUMN quotation_date;
    RAISE NOTICE '✅ Removed quotation_date column';
  ELSE
    RAISE NOTICE 'ℹ️  quotation_date column does not exist';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Error removing quotation_date: %', SQLERRM;
END $$;

-- Step 5: Remove old single-item columns (we use items JSONB now)
DO $$ 
BEGIN
  -- Remove item_code column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'item_code'
  ) THEN
    ALTER TABLE quotations DROP COLUMN item_code;
    RAISE NOTICE '✅ Removed old item_code column';
  ELSE
    RAISE NOTICE 'ℹ️  item_code column does not exist';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Error removing item_code: %', SQLERRM;
END $$;

DO $$ 
BEGIN
  -- Remove price column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'price'
  ) THEN
    ALTER TABLE quotations DROP COLUMN price;
    RAISE NOTICE '✅ Removed old price column';
  ELSE
    RAISE NOTICE 'ℹ️  price column does not exist';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Error removing price: %', SQLERRM;
END $$;

DO $$ 
BEGIN
  -- Remove quantity column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE quotations DROP COLUMN quantity;
    RAISE NOTICE '✅ Removed old quantity column';
  ELSE
    RAISE NOTICE 'ℹ️  quantity column does not exist';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Error removing quantity: %', SQLERRM;
END $$;

-- Step 6: Add items column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'items'
  ) THEN
    ALTER TABLE quotations ADD COLUMN items JSONB;
    RAISE NOTICE '✅ Added items column';
  ELSE
    RAISE NOTICE 'ℹ️  items column already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Error adding items column: %', SQLERRM;
END $$;

-- Step 6: Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'status'
  ) THEN
    ALTER TABLE quotations ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    UPDATE quotations SET status = 'pending' WHERE status IS NULL;
    RAISE NOTICE '✅ Added status column';
  ELSE
    RAISE NOTICE 'ℹ️  status column already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Error adding status column: %', SQLERRM;
END $$;

-- Step 7: Verify final schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'quotations'
ORDER BY ordinal_position;

-- Done! Restart your server after running this script.

