const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function debugAuthDeep() {
  console.log('🔍 Deep debugging auth system...')
  
  // Check all triggers on auth.users
  try {
    const { data: triggers } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT trigger_name, event_manipulation, action_statement 
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
      `
    })
    console.log('Auth.users triggers:', triggers)
  } catch (e) {
    console.log('Could not check triggers:', e.message)
  }
  
  // Check if our function exists
  try {
    const { data: functions } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT proname, prosrc 
        FROM pg_proc 
        WHERE proname = 'handle_new_user'
      `
    })
    console.log('handle_new_user function exists:', functions?.length > 0 ? 'YES' : 'NO')
  } catch (e) {
    console.log('Could not check functions:', e.message)
  }
  
  // Try to manually insert into auth.users to isolate the issue
  console.log('🧪 Testing direct auth.users insert...')
  
  try {
    const testUserId = `test-${Date.now()}`
    const { data: directInsert } = await supabase.rpc('exec_sql', { 
      sql: `
        INSERT INTO auth.users (
          id, 
          email, 
          encrypted_password, 
          email_confirmed_at, 
          created_at, 
          updated_at,
          raw_user_meta_data,
          confirmation_token
        ) VALUES (
          '${testUserId}',
          'direct.test@example.com',
          '$2a$10$dummy.encrypted.password.hash.here',
          NOW(),
          NOW(),
          NOW(),
          '{"role": "patient", "first_name": "Direct", "last_name": "Test"}'::jsonb,
          encode(gen_random_bytes(32), 'hex')
        )
        RETURNING id, email
      `
    })
    
    console.log('✅ Direct insert successful:', directInsert)
    
    // Check if profile was created by trigger
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single()
      
    console.log('Profile created by trigger:', profile ? 'YES' : 'NO')
    if (profile) {
      console.log('Profile details:', profile)
    }
    
  } catch (e) {
    console.log('❌ Direct insert failed:', e.message)
    
    // This might be a permissions issue. Let's check table permissions
    try {
      const { data: permissions } = await supabase.rpc('exec_sql', { 
        sql: `
          SELECT grantee, privilege_type 
          FROM information_schema.table_privileges 
          WHERE table_name = 'users' AND table_schema = 'auth'
        `
      })
      console.log('Auth.users permissions:', permissions)
    } catch (e2) {
      console.log('Could not check permissions:', e2.message)
    }
  }
  
  // Let's also disable RLS temporarily to see if that's the issue
  console.log('🔧 Temporarily disabling RLS to test...')
  
  try {
    await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;'
    })
    console.log('✅ RLS disabled on profiles')
    
    // Try signup again
    const testEmail = `rls.test.${Date.now()}@example.com`
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: {
        data: {
          role: 'patient',
          first_name: 'RLS',
          last_name: 'Test'
        }
      }
    })
    
    if (error) {
      console.log('❌ Signup still failing with RLS disabled:', error.message)
    } else {
      console.log('✅ Signup works with RLS disabled!')
      console.log('User:', data.user?.email)
    }
    
    // Re-enable RLS
    await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;'
    })
    console.log('✅ RLS re-enabled on profiles')
    
  } catch (e) {
    console.log('RLS test failed:', e.message)
  }
}

debugAuthDeep().catch(console.error)