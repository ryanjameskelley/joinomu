-- Check All Table Structures for Trigger Compatibility
-- Run this in Supabase Dashboard → SQL Editor

-- Check patients table structure
SELECT 'PATIENTS TABLE' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check providers table structure  
SELECT 'PROVIDERS TABLE' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'providers' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check admins table structure
SELECT 'ADMINS TABLE' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'admins' 
    AND table_schema = 'public'
ORDER BY ordinal_position;