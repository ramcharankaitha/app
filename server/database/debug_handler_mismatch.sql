-- Debug script to find handler name mismatches
-- Run these queries to see what's in the database

-- 1. Check what handler names are stored in services
SELECT DISTINCT handler_name, handler_id, COUNT(*) as service_count
FROM services 
WHERE handler_name IS NOT NULL
GROUP BY handler_name, handler_id
ORDER BY handler_name;

-- 2. Check what staff names exist (potential handlers)
SELECT id, full_name, username, is_handler
FROM staff
WHERE is_handler = true
ORDER BY full_name;

-- 3. Check services that don't have handler_id but have handler_name
SELECT id, handler_name, handler_id, customer_name, created_at
FROM services
WHERE handler_name IS NOT NULL AND handler_id IS NULL
ORDER BY created_at DESC;

-- 4. Try to match services with staff (showing potential matches)
SELECT 
    s.id as service_id,
    s.handler_name as service_handler_name,
    s.handler_id as service_handler_id,
    st.id as staff_id,
    st.full_name as staff_full_name,
    CASE 
        WHEN LOWER(TRIM(s.handler_name)) = LOWER(TRIM(st.full_name)) THEN 'EXACT MATCH'
        WHEN LOWER(TRIM(s.handler_name)) LIKE LOWER(TRIM(st.full_name)) || '%' THEN 'PARTIAL MATCH (service starts with staff)'
        WHEN LOWER(TRIM(st.full_name)) LIKE LOWER(TRIM(s.handler_name)) || '%' THEN 'PARTIAL MATCH (staff starts with service)'
        ELSE 'NO MATCH'
    END as match_status
FROM services s
LEFT JOIN staff st ON LOWER(TRIM(s.handler_name)) = LOWER(TRIM(st.full_name))
WHERE s.handler_name IS NOT NULL
ORDER BY s.created_at DESC
LIMIT 20;

