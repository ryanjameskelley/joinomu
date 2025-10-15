const { createClient } = require('@supabase/supabase-js')

const serviceSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function diagnoseAuthIssue() {
  console.log('🔍 Diagnosing what broke auth after migration/data dump...')
  
  // 1. Check if auth triggers exist
  console.log('\n1. Checking auth triggers:')
  try {
    const { data: triggers } = await serviceSupabase.rpc('exec_sql', {
      sql: `
        SELECT trigger_name, event_manipulation, event_object_table
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
      `
    })
    console.log('Auth triggers:', triggers || 'None found')
  } catch (e) {
    console.log('❌ Cannot check triggers:', e.message)
  }
  
  // 2. Check if auth functions exist
  console.log('\n2. Checking auth functions:')
  try {
    const { data: functions } = await serviceSupabase.rpc('exec_sql', {
      sql: `
        SELECT proname, proowner 
        FROM pg_proc 
        WHERE proname LIKE '%handle%user%' OR proname LIKE '%auth%'
      `
    })
    console.log('Auth functions:', functions || 'None found')
  } catch (e) {
    console.log('❌ Cannot check functions:', e.message)
  }
  
  // 3. Check table constraints that might be broken
  console.log('\n3. Checking table constraints:')
  try {
    const { data: constraints } = await serviceSupabase.rpc('exec_sql', {
      sql: `
        SELECT table_name, constraint_name, constraint_type
        FROM information_schema.table_constraints 
        WHERE table_name IN ('profiles', 'patients', 'providers', 'admins')
        AND constraint_type = 'FOREIGN KEY'
      `
    })
    console.log('Foreign key constraints:', constraints || 'None found')
  } catch (e) {
    console.log('❌ Cannot check constraints:', e.message)
  }
  
  // 4. Check if there are orphaned profiles (profiles without auth.users)
  console.log('\n4. Checking for orphaned profiles:')
  try {
    const { data: orphanedProfiles } = await serviceSupabase.rpc('exec_sql', {
      sql: `
        SELECT p.id, p.email, p.role 
        FROM profiles p 
        LEFT JOIN auth.users u ON p.id = u.id 
        WHERE u.id IS NULL
        LIMIT 5
      `
    })
    console.log('Orphaned profiles (profiles without auth.users):', orphanedProfiles || 'None')
    
    if (orphanedProfiles && orphanedProfiles.length > 0) {
      console.log('🚨 FOUND THE ISSUE: Orphaned profiles exist!')
      console.log('This can cause foreign key constraint violations during auth creation')
    }
  } catch (e) {
    console.log('❌ Cannot check orphaned profiles:', e.message)
  }
  
  // 5. Check auth schema permissions
  console.log('\n5. Checking auth schema permissions:')
  try {
    const { data: permissions } = await serviceSupabase.rpc('exec_sql', {
      sql: `
        SELECT grantee, privilege_type 
        FROM information_schema.table_privileges 
        WHERE table_name = 'users' AND table_schema = 'auth'
        LIMIT 5
      `
    })
    console.log('Auth.users permissions:', permissions || 'None found')
  } catch (e) {
    console.log('❌ Cannot check permissions:', e.message)
  }
  
  // 6. Check if auth.users table has any issues
  console.log('\n6. Checking auth.users table integrity:')
  try {
    const { data: authUsers } = await serviceSupabase.rpc('exec_sql', {
      sql: `SELECT COUNT(*) as count FROM auth.users`
    })
    console.log('Total auth.users records:', authUsers?.[0]?.count || 0)
    
    const { data: recentUsers } = await serviceSupabase.rpc('exec_sql', {
      sql: `SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 3`
    })
    console.log('Recent auth.users:', recentUsers || 'None')
  } catch (e) {
    console.log('❌ Cannot access auth.users:', e.message)
  }
  
  // 7. Check RLS policies that might be blocking
  console.log('\n7. Checking RLS policies:')
  try {
    const { data: policies } = await serviceSupabase.rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'patients', 'providers', 'admins')
        LIMIT 10
      `
    })
    console.log('RLS policies:', policies || 'None found')
  } catch (e) {
    console.log('❌ Cannot check RLS policies:', e.message)
  }
  
  // 8. Try a test insert into auth.users to see exact error
  console.log('\n8. Testing direct auth.users insert:')
  try {
    const testId = 'test-diagnostic-user'
    await serviceSupabase.rpc('exec_sql', {
      sql: `
        INSERT INTO auth.users (
          id, email, encrypted_password, email_confirmed_at,
          created_at, updated_at, confirmation_token
        ) VALUES (
          '${testId}',
          'diagnostic@test.com',
          '$2a$10$dummy',
          NOW(),
          NOW(),
          NOW(),
          'dummy-token'
        )
      `
    })
    console.log('✅ Direct auth.users insert succeeded - auth table is fine')
    
    // Clean up test user
    await serviceSupabase.rpc('exec_sql', {
      sql: `DELETE FROM auth.users WHERE id = '${testId}'`
    })
    
  } catch (e) {
    console.log('❌ Direct auth.users insert failed:', e.message)
    console.log('🚨 This confirms the auth.users table itself has issues!')
  }
  
  console.log('\n📊 DIAGNOSIS COMPLETE')
  console.log('\nMost likely causes of auth creation failure after data migration:')
  console.log('1. Orphaned profile records causing FK constraint violations')
  console.log('2. Broken auth triggers after schema changes')
  console.log('3. RLS policies blocking auth operations')
  console.log('4. Auth.users table corruption or permission issues')
}

diagnoseAuthIssue().catch(console.error)