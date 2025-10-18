-- Check what constraints exist on appointment_history table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'appointment_history'::regclass
AND contype = 'c';

-- Also check the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointment_history'
ORDER BY ordinal_position;