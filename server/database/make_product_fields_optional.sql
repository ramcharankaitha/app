-- Make Product Fields Optional
-- Run this script to make product fields optional (remove NOT NULL constraints)

-- Make product_name optional (if it has NOT NULL constraint)
DO $$
BEGIN
    -- Check if product_name has NOT NULL constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' 
        AND column_name = 'product_name' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE products ALTER COLUMN product_name DROP NOT NULL;
    END IF;
END $$;

-- Make item_code optional (remove NOT NULL, keep UNIQUE if exists)
DO $$
BEGIN
    -- Drop NOT NULL constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' 
        AND column_name = 'item_code' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE products ALTER COLUMN item_code DROP NOT NULL;
    END IF;
END $$;

-- Make sku_code optional (remove NOT NULL, keep UNIQUE if exists)
DO $$
BEGIN
    -- Drop NOT NULL constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' 
        AND column_name = 'sku_code' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE products ALTER COLUMN sku_code DROP NOT NULL;
    END IF;
END $$;

-- Verify the changes
SELECT 
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('product_name', 'item_code', 'sku_code', 'image_url')
ORDER BY column_name;

-- Expected result: is_nullable should be 'YES' for all checked columns
-- Note: item_code and sku_code may still have UNIQUE constraints, which is fine

