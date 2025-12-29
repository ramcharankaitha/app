-- Fix handler_ids in services table
-- This script will help identify and fix handler_id mismatches

-- Step 1: Check current state
SELECT 
    'Services with handler_name but no handler_id' as check_type,
    COUNT(*) as count
FROM services
WHERE handler_name IS NOT NULL AND handler_id IS NULL

UNION ALL

SELECT 
    'Services with handler_id' as check_type,
    COUNT(*) as count
FROM services
WHERE handler_id IS NOT NULL

UNION ALL

SELECT 
    'Services with handler_name' as check_type,
    COUNT(*) as count
FROM services
WHERE handler_name IS NOT NULL;

-- Step 2: Show services that need fixing
SELECT 
    s.id,
    s.handler_name,
    s.handler_id as current_handler_id,
    st.id as correct_handler_id,
    st.full_name as staff_full_name
FROM services s
LEFT JOIN staff st ON LOWER(TRIM(s.handler_name)) = LOWER(TRIM(st.full_name))
WHERE s.handler_name IS NOT NULL
ORDER BY s.created_at DESC;

-- Step 3: Update handler_ids (run this after verifying Step 2)
-- This will update services where handler_name matches staff full_name
UPDATE services s
SET handler_id = st.id
FROM staff st
WHERE LOWER(TRIM(s.handler_name)) = LOWER(TRIM(st.full_name))
  AND s.handler_id IS NULL
  AND s.handler_name IS NOT NULL;

-- Step 4: Also update services where handler_id exists but might be wrong
-- This will correct handler_ids based on handler_name match
UPDATE services s
SET handler_id = st.id
FROM staff st
WHERE LOWER(TRIM(s.handler_name)) = LOWER(TRIM(st.full_name))
  AND (s.handler_id IS NULL OR s.handler_id != st.id)
  AND s.handler_name IS NOT NULL;

-- Step 5: Verify the fix
SELECT 
    s.id,
    s.handler_name,
    s.handler_id,
    st.full_name as staff_full_name,
    CASE 
        WHEN s.handler_id = st.id THEN 'MATCHED'
        ELSE 'MISMATCH'
    END as status
FROM services s
LEFT JOIN staff st ON s.handler_id = st.id
WHERE s.handler_name IS NOT NULL
ORDER BY s.created_at DESC
LIMIT 20;

