-- Test if the RPC function exists and works
SELECT routine_name, routine_type, specific_name 
FROM information_schema.routines 
WHERE routine_name = 'create_admin_record' 
AND routine_schema = 'public';

-- Test the function with dummy data
SELECT create_admin_record(
  gen_random_uuid(),
  'test-rpc@example.com',
  'Test',
  'Admin'
) as test_result;