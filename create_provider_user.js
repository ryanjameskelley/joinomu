const { createClient } = require('@supabase/supabase-js')

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createProviderUser() {
  try {
    console.log('👤 Creating provider user: provider@test.com...')
    
    // Sign up a new user using the normal flow
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'provider@test.com',
      password: 'password',
      options: {
        data: {
          full_name: 'Dr. Test Provider'
        }
      }
    })
    
    if (signupError) {
      console.error('❌ Signup error:', signupError.message)
      return
    }
    
    if (!signupData.user) {
      console.error('❌ No user data returned')
      return
    }
    
    console.log('✅ User signup successful')
    console.log(`   Auth ID: ${signupData.user.id}`)
    console.log(`   Email: ${signupData.user.email}`)
    
    // Use service key client for database operations
    const serviceSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU', {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    // Create profile
    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .upsert([
        {
          id: signupData.user.id,
          full_name: 'Dr. Test Provider',
          email: 'provider@test.com',
          role: 'provider'
        }
      ])
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
    } else {
      console.log('✅ Profile created')
    }
    
    // Create provider
    const { error: providerError } = await serviceSupabase
      .from('providers')
      .upsert([
        {
          id: signupData.user.id,
          name: 'Dr. Test Provider',
          email: 'provider@test.com',
          specialty: 'Family Medicine',
          license_number: 'MD789012',
          phone: '+1-555-0456',
          location: 'San Francisco, CA'
        }
      ])
    
    if (providerError) {
      console.error('❌ Provider error:', providerError)
    } else {
      console.log('✅ Provider record created')
    }
    
    console.log('\n🎉 Provider user ready to login!')
    console.log('📧 Email: provider@test.com')
    console.log('🔑 Password: password')
    console.log(`🆔 Auth ID: ${signupData.user.id}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createProviderUser()