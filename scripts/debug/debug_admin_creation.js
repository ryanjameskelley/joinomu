const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function debugAdminCreation() {
  try {
    console.log('🔍 Debugging admin user creation issue...')
    
    // First, let's check if we can access the database at all
    console.log('1. Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('❌ Database connection error:', testError)
      return
    } else {
      console.log('✅ Database connection working')
    }

    // 2. Check if the trigger function exists
    console.log('2. Checking if trigger function exists...')
    const { data: functionData, error: functionError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'handle_new_user')

    if (functionError) {
      console.log('⚠️  Could not check functions:', functionError)
    } else if (!functionData || functionData.length === 0) {
      console.log('❌ handle_new_user function not found')
    } else {
      console.log('✅ handle_new_user function exists')
    }

    // 3. Check if the trigger is active
    console.log('3. Checking if trigger is active...')
    const { data: triggerData, error: triggerError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created'" 
      })

    if (triggerError) {
      console.log('⚠️  Could not check trigger:', triggerError)
    } else {
      console.log('Trigger info:', triggerData)
    }

    // 4. Try to manually test the trigger function
    console.log('4. Testing if we can create records directly in profiles table...')
    const testUuid = 'test-uuid-' + Date.now()
    const { error: profileTestError } = await supabase
      .from('profiles')
      .insert({
        id: testUuid,
        email: 'test@example.com',
        role: 'admin',
        first_name: 'Test',
        last_name: 'User'
      })

    if (profileTestError) {
      console.error('❌ Cannot insert into profiles table:', profileTestError)
    } else {
      console.log('✅ Can insert into profiles table')
      
      // Clean up test record
      await supabase.from('profiles').delete().eq('id', testUuid)
      console.log('✅ Test record cleaned up')
    }

    // 5. Check if there are any constraints that might be blocking
    console.log('5. Checking profiles table constraints...')
    const { data: constraintData, error: constraintError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT conname, contype, pg_get_constraintdef(oid) as definition 
          FROM pg_constraint 
          WHERE conrelid = 'public.profiles'::regclass
        `
      })

    if (constraintError) {
      console.log('⚠️  Could not check constraints:', constraintError)
    } else {
      console.log('Profile table constraints:')
      console.log(constraintData)
    }

    // 6. Try a very basic auth user creation to see if it's the auth system itself
    console.log('6. Testing basic auth functionality...')
    const randomEmail = `test${Date.now()}@example.com`
    const { data: basicAuth, error: basicAuthError } = await supabase.auth.admin.createUser({
      email: randomEmail,
      password: 'testpassword123',
      email_confirm: true
    })

    if (basicAuthError) {
      console.error('❌ Basic auth user creation also fails:', basicAuthError)
      console.error('This suggests a fundamental issue with auth or database setup')
    } else {
      console.log('✅ Basic auth user creation works:', basicAuth.user.id)
      
      // Clean up test user
      await supabase.auth.admin.deleteUser(basicAuth.user.id)
      console.log('✅ Test auth user cleaned up')
    }

  } catch (error) {
    console.error('❌ Debug script error:', error)
  }
}

debugAdminCreation()