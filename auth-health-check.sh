#!/bin/bash
# auth-health-check.sh - Quick health check for authentication system

echo "🏥 AUTHENTICATION SYSTEM HEALTH CHECK"
echo "====================================="

# Check if trigger exists
echo "🔧 Checking auth trigger..."
docker exec supabase_db_joinomu-monorepo psql -U postgres -d postgres -c "
SELECT 
  'Auth Trigger Check' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
;"

# Check if function exists
echo ""
echo "⚙️ Checking trigger function..."
docker exec supabase_db_joinomu-monorepo psql -U postgres -d postgres -c "
SELECT 
  'Auth Function Check' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
;"

# Check for orphaned users
echo ""
echo "👥 Checking for orphaned auth records..."
docker exec supabase_db_joinomu-monorepo psql -U postgres -d postgres -c "
WITH auth_health AS (
  SELECT 
    COUNT(*) as total_users,
    COUNT(p.id) as users_with_profiles,
    COUNT(*) - COUNT(p.id) as orphaned_users
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
)
SELECT 
  total_users,
  users_with_profiles,
  orphaned_users,
  CASE 
    WHEN orphaned_users = 0 THEN '✅ HEALTHY'
    WHEN orphaned_users < 3 THEN '⚠️ SOME ISSUES'
    ELSE '❌ CRITICAL'
  END as health_status
FROM auth_health;
"

# Check table counts
echo ""
echo "📊 Table record counts..."
docker exec supabase_db_joinomu-monorepo psql -U postgres -d postgres -c "
SELECT 
  'profiles' as table_name, COUNT(*) as record_count FROM public.profiles
UNION ALL
SELECT 
  'patients' as table_name, COUNT(*) as record_count FROM public.patients
UNION ALL
SELECT 
  'providers' as table_name, COUNT(*) as record_count FROM public.providers
UNION ALL
SELECT 
  'admins' as table_name, COUNT(*) as record_count FROM public.admins
ORDER BY table_name;
"

echo ""
echo "✅ Health check completed at $(date)"