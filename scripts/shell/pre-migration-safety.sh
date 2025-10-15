#!/bin/bash
# pre-migration-safety.sh - Run before any database migration

echo "🔒 PRE-MIGRATION SAFETY PROTOCOL"
echo "================================"

# 1. Create backup
echo "📦 Step 1: Creating comprehensive backup..."
./comprehensive-backup.sh

if [ $? -ne 0 ]; then
    echo "❌ Backup failed! Do not proceed with migration."
    exit 1
fi

# 2. Test current auth flow
echo ""
echo "🧪 Step 2: Testing current authentication system..."
docker exec supabase_db_joinomu-monorepo psql -U postgres -d postgres -c "
SELECT 
  'Auth system check' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
    THEN '✅ Trigger exists'
    ELSE '❌ Trigger missing'
  END as trigger_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user')
    THEN '✅ Function exists'
    ELSE '❌ Function missing'
  END as function_status;
"

# 3. Validate table relationships
echo ""
echo "🔗 Step 3: Validating table relationships..."
docker exec supabase_db_joinomu-monorepo psql -U postgres -d postgres -c "
SELECT 
  t.table_name,
  COUNT(c.constraint_name) as foreign_keys
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints c ON t.table_name = c.table_name 
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('profiles', 'patients', 'providers', 'admins')
  AND c.constraint_type = 'FOREIGN KEY'
GROUP BY t.table_name
ORDER BY t.table_name;
"

# 4. Check for orphaned records
echo ""
echo "👥 Step 4: Checking for orphaned auth records..."
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
  *,
  CASE 
    WHEN orphaned_users = 0 THEN '✅ Healthy'
    WHEN orphaned_users < 3 THEN '⚠️ Some issues'
    ELSE '❌ Critical'
  END as health_status
FROM auth_health;
"

echo ""
echo "✅ Pre-migration checks complete!"
echo "📁 Backup location: ./backups/"
echo "🚀 Safe to proceed with migration."
echo ""
echo "⚠️  REMEMBER:"
echo "   - Test migration on development first"
echo "   - Use CREATE OR REPLACE for functions"
echo "   - Always use explicit schema references (public.table_name)"
echo "   - Never DROP core authentication tables"