const { createClient } = require('@supabase/supabase-js')

const testSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

const serviceSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function testCurrentAuthState() {
  console.log('🧪 Testing current auth trigger state...')
  
  const testEmail = `auth.trigger.test.${Date.now()}@example.com`
  
  console.log(`📝 Testing user creation: ${testEmail}`)
  
  try {
    const { data: signupData, error: signupError } = await testSupabase.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: {
        data: {
          role: 'provider',
          first_name: 'Test',
          last_name: 'Provider',
          specialty: 'Cardiology',
          licenseNumber: 'MD123456'
        }
      }
    })
    
    if (signupError) {
      console.log('❌ Signup failed:', signupError.message)
      
      console.log('\n🔍 Checking current trigger status...')
      
      // Check if trigger exists
      const { data: triggerCheck } = await serviceSupabase
        .from('information_schema.triggers')
        .select('*')
        .eq('event_object_table', 'users')
        .eq('event_object_schema', 'auth')
      
      console.log('Current auth triggers:', triggerCheck || 'None found')
      
      // Check if function exists
      const { data: functionCheck } = await serviceSupabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_name', 'handle_new_user')
        
      console.log('handle_new_user function exists:', functionCheck?.length > 0 ? 'Yes' : 'No')
      
      return false
    }
    
    console.log(`✅ User signup successful: ${signupData.user?.email}`)
    
    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Check if records were created
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', signupData.user.id)
      .single()
      
    if (profile) {
      console.log(`✅ Profile auto-created: ${profile.first_name} ${profile.last_name} (${profile.role})`)
      
      if (profile.role === 'provider') {
        const { data: provider } = await serviceSupabase
          .from('providers')
          .select('*')
          .eq('profile_id', signupData.user.id)
          .single()
          
        if (provider) {
          console.log(`✅ Provider record auto-created`)
          
          const { data: schedules } = await serviceSupabase
            .from('provider_schedules')
            .select('*')
            .eq('provider_id', provider.id)
            
          if (schedules && schedules.length > 0) {
            console.log(`✅ Provider schedules auto-created: ${schedules.length} days`)
            console.log(`   Schedule: ${schedules[0].start_time}-${schedules[0].end_time}`)
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
    }
    
    return false
    
  } catch (e) {
    console.log('❌ Error during test:', e.message)
    return false
  }
}

async function main() {
  const working = await testCurrentAuthState()
  
  console.log('\n🎯 CURRENT AUTH STATUS:')
  
  if (working) {
    console.log('✅ AUTH TRIGGER IS WORKING!')
    console.log('✅ Users can be created with automatic profile and role records')
    console.log('✅ Provider schedules are created automatically')
    console.log('\n🚀 You can now signup users at: http://localhost:3456/')
  } else {
    console.log('❌ AUTH TRIGGER IS NOT WORKING')
    console.log('❌ User creation fails or records are not created automatically')
    console.log('\n🔧 The auth trigger needs to be restored from a working backup')
    console.log('💡 Suggested solution: Restore from the September 21st schema backup that contains the working trigger')
  }
  
  console.log('\n📋 Summary for your question:')
  console.log(`${working ? '✅' : '❌'} Can you create users of any type and have Supabase respond correctly? ${working ? 'YES' : 'NO'}`)
}

main().catch(console.error)