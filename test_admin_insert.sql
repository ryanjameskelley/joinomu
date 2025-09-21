-- Test if we can insert into admins table manually
-- This will help us understand RLS permissions

-- Check current RLS policies on admins table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admins';

-- Check if RLS is enabled on admins table
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE tablename = 'admins';

-- Try a simple test insert (will fail if RLS blocks it)
INSERT INTO admins (id, user_id, email, first_name, last_name, role, permissions, active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  gen_random_uuid(), -- fake user_id for test
  'test@example.com',
  'Test',
  'Admin',
  'admin',
  ARRAY['messages', 'patients', 'dashboard'],
  true,
  NOW(),
  NOW()
);

-- Clean up test record
DELETE FROM admins WHERE email = 'test@example.com';