const { createClient } = require('@supabase/supabase-js')
const { Client } = require('pg')

const serviceSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function debugAuthTrigger() {
  console.log('🔍 Debugging auth trigger...')
  
  const client = new Client({
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
  })
  
  try {
    await client.connect()
    
    // Check if trigger exists
    const triggerResult = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers 
      WHERE event_object_table = 'users' 
      AND event_object_schema = 'auth'
    `)
    console.log('Auth triggers:', triggerResult.rows)
    
    // Check if function exists
    const functionResult = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname = 'handle_new_user'
    `)
    console.log('handle_new_user function exists:', functionResult.rows.length > 0)
    
    // Test the trigger manually by creating a test user directly in auth.users
    console.log('\n🧪 Testing trigger manually...')
    
    const testUserId = 'aaaabbbb-cccc-dddd-eeee-ffffffff1111'
    const testEmail = `manual.test.${Date.now()}@example.com`
    
    // Insert into auth.users directly
    await client.query(`
      INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, confirmation_token
      ) VALUES (
        $1, $2, 
        '$2a$10$dummy',
        NOW(),
        NOW(), 
        NOW(),
        '{"role": "provider", "first_name": "Manual", "last_name": "Test", "specialty": "Testing"}'::jsonb,
        'dummy-token'
      )
    `, [testUserId, testEmail])
    
    console.log(`✅ Manually inserted auth user: ${testUserId}`)
    
    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if profile was created
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single()
      
    if (profile) {
      console.log(`✅ Profile auto-created by trigger: ${profile.first_name} ${profile.last_name} (${profile.role})`)
      
      if (profile.role === 'provider') {
        const { data: provider } = await serviceSupabase
          .from('providers')
          .select('*')
          .eq('profile_id', testUserId)
          .single()
          
        if (provider) {
          console.log(`✅ Provider record auto-created`)
          
          const { data: schedules } = await serviceSupabase
            .from('provider_schedules')
            .select('*')
            .eq('provider_id', provider.id)
            
          if (schedules && schedules.length > 0) {
            console.log(`✅ Provider schedules auto-created: ${schedules.length} days`)
            console.log('\n🎉 AUTH TRIGGER IS WORKING PERFECTLY!')
            return true
          } else {
            console.log(`❌ Provider schedules NOT created`)
          }
        } else {
          console.log(`❌ Provider record NOT created`)
        }
      }
    } else {
      console.log(`❌ Profile NOT created by trigger`)
      
      // Check if there were any warnings in PostgreSQL logs
      console.log('\n🔍 Checking for trigger warnings...')
      const logResult = await client.query(`
        SELECT message FROM pg_stat_activity WHERE state = 'active' LIMIT 5
      `)
      console.log('Active processes:', logResult.rows)
    }
    
    return false
    
  } catch (error) {
    console.log('❌ Error debugging trigger:', error.message)
    return false
  } finally {
    await client.end()
  }
}

async function testSupabaseSignup() {
  console.log('\n🧪 Testing normal Supabase signup...')
  
  const testSupabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  )
  
  const testEmail = `supabase.test.${Date.now()}@example.com`
  
  try {
    const { data: signupData, error: signupError } = await testSupabase.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: {
        data: {
          role: 'admin',
          first_name: 'Supabase',
          last_name: 'Test'
        }
      }
    })
    
    if (signupError) {
      console.log('❌ Supabase signup failed:', signupError.message)
      return false
    }
    
    console.log(`✅ Supabase signup successful: ${signupData.user?.id}`)
    
    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Check results
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', signupData.user.id)
      .single()
      
    if (profile) {
      console.log(`✅ Profile auto-created: ${profile.first_name} ${profile.last_name} (${profile.role})`)
      
      const { data: admin } = await serviceSupabase
        .from('admins')
        .select('*')
        .eq('profile_id', signupData.user.id)
        .single()
        
      if (admin) {
        console.log(`✅ Admin record auto-created with permissions: ${admin.permissions}`)
        return true
      }
    } else {
      console.log(`❌ Profile NOT created via Supabase signup`)
    }
    
    return false
    
  } catch (e) {
    console.log('❌ Error during Supabase signup test:', e.message)
    return false
  }
}

async function main() {
  const manualWorking = await debugAuthTrigger()
  const supabaseWorking = await testSupabaseSignup()
  
  console.log('\n📊 FINAL RESULTS:')
  
  if (manualWorking && supabaseWorking) {
    console.log('🎉 AUTH TRIGGER COMPLETELY WORKING!')
    console.log('✅ ANSWER: YES, you can create users of any type and have Supabase respond correctly!')
  } else if (manualWorking) {
    console.log('⚠️ Auth trigger works with manual insertion but not Supabase signup')
    console.log('❌ ANSWER: NO, Supabase signup still has issues')
  } else {
    console.log('❌ Auth trigger not working at all')
    console.log('❌ ANSWER: NO, user creation with auto table population is not working')
  }
  
  console.log('\n🔧 Status:')
  console.log(`Manual auth.users insert → Profile creation: ${manualWorking ? '✅' : '❌'}`)
  console.log(`Supabase auth.signUp → Profile creation: ${supabaseWorking ? '✅' : '❌'}`)
}

main().catch(console.error)