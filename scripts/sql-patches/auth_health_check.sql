-- Comprehensive Authentication Health Check based on the guide

-- 1. Check for auth trigger (should be DISABLED based on our approach)
SELECT 
  'Auth Trigger Status' as check_category,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
    THEN '❌ Trigger exists (should be disabled for fallback pattern)'
    ELSE '✅ Trigger disabled (using fallback pattern)'
  END as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user')
    THEN '⚠️ Function exists (unused)'
    ELSE '✅ Function removed'
  END as function_status;

-- 2. Run the Health Check Query from the guide
WITH auth_health AS (
  SELECT
    COUNT(*) as total_users,
    COUNT(p.id) as users_with_profiles,
    COUNT(*) - COUNT(p.id) as orphaned_users
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE u.created_at > NOW() - INTERVAL '24 hours'
)
SELECT
  'Auth Health (24hrs)' as check_category,
  total_users,
  users_with_profiles,
  orphaned_users,
  CASE
    WHEN orphaned_users = 0 THEN '✅ Healthy'
    WHEN orphaned_users < 3 THEN '⚠️ Some issues'
    ELSE '❌ Critical'
  END as health_status
FROM auth_health;

-- 3. Overall system health check
WITH system_health AS (
  SELECT
    COUNT(*) as total_auth_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM public.patients) as total_patients,
    (SELECT COUNT(*) FROM public.providers) as total_providers,  
    (SELECT COUNT(*) FROM public.admins) as total_admins
  FROM auth.users
)
SELECT
  'System Overview' as check_category,
  total_auth_users,
  total_profiles,
  total_patients,
  total_providers,
  total_admins,
  CASE
    WHEN total_profiles >= total_auth_users THEN '✅ Profiles match auth users'
    ELSE '❌ Missing profiles for some auth users'
  END as profile_status
FROM system_health;

-- 4. Check recent auth failures (if auth_trigger_logs table exists)
SELECT 
  'Recent Auth Failures' as check_category,
  COUNT(*) as failure_count,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ No recent failures'
    WHEN COUNT(*) < 5 THEN '⚠️ Some failures'
    ELSE '❌ Many failures'
  END as failure_status
FROM public.auth_trigger_logs 
WHERE success = false 
  AND created_at > NOW() - INTERVAL '1 hour';

-- 5. Test Schema Relationships
SELECT 
  'Schema Relationships' as check_category,
  t.table_name,
  COUNT(c.constraint_name) as foreign_key_count
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints c ON t.table_name = c.table_name 
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('profiles', 'patients', 'providers', 'admins')
  AND (c.constraint_type = 'FOREIGN KEY' OR c.constraint_type IS NULL)
GROUP BY t.table_name
ORDER BY t.table_name;

-- 6. Verify auth service fallback pattern can work by testing service role permissions
-- This checks if service role can create records (needed for fallback pattern)
SELECT 
  'Service Role Access' as check_category,
  schemaname,
  tablename,
  CASE 
    WHEN has_table_privilege('service_role', schemaname||'.'||tablename, 'INSERT') 
    THEN '✅ Can INSERT'
    ELSE '❌ Cannot INSERT'
  END as insert_permission
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'patients', 'providers', 'admins')
ORDER BY tablename;