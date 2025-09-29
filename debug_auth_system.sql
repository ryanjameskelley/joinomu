-- Debug the current auth system state
SELECT 
  'Auth Triggers Check' as check_type,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth';

-- Check for any functions that might be causing issues
SELECT 
  'Auth Functions Check' as check_type,
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%handle%user%' 
  OR routine_name LIKE '%auth%';

-- Check constraints on auth.users table
SELECT 
  'Auth Constraints Check' as check_type,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'users' 
  AND table_schema = 'auth';

-- Check for any foreign key constraints that might be causing issues
SELECT 
  'Foreign Key Constraints Check' as check_type,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'users' OR ccu.table_name = 'users')
  AND tc.table_schema IN ('auth', 'public');

-- Test creating a simple auth user manually
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  raw_user_meta_data,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'debug-test@example.com',
  crypt('testpass', gen_salt('bf')),
  '{"role": "admin", "first_name": "Debug", "last_name": "Test"}'::jsonb,
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- Check if the test user was created
SELECT 
  'Test User Creation' as check_type,
  id, 
  email, 
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users 
WHERE email = 'debug-test@example.com';

-- Clean up the test user
DELETE FROM auth.users WHERE email = 'debug-test@example.com';