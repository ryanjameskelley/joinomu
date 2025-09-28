const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createWatsonUser() {
  try {
    console.log('👤 Creating dr.watson@test.com user...')
    
    // Generate a proper UUID
    const userId = uuidv4()
    console.log(`🔑 Generated UUID: ${userId}`)
    
    // Create the user in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'dr.watson@test.com',
      password: 'password',
      email_confirm: true,
      user_metadata: {
        full_name: 'Dr. John Watson'
      }
    })
    
    if (authError) {
      console.error('❌ Error creating auth user:', authError)
      return
    }
    
    console.log('✅ Auth user created successfully')
    console.log(`   Auth ID: ${authUser.user.id}`)
    console.log(`   Email: ${authUser.user.email}`)
    
    // Create profile record
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authUser.user.id,
          full_name: 'Dr. John Watson',
          email: 'dr.watson@test.com',
          role: 'provider'
        }
      ])
      .select()
    
    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
    } else {
      console.log('✅ Profile created successfully')
    }
    
    // Create provider record
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .insert([
        {
          id: authUser.user.id,
          name: 'Dr. John Watson',
          email: 'dr.watson@test.com',
          specialty: 'Family Medicine',
          license_number: 'MD123456',
          phone: '+1-555-0123',
          location: 'San Francisco, CA'
        }
      ])
      .select()
    
    if (providerError) {
      console.error('❌ Error creating provider record:', providerError)
    } else {
      console.log('✅ Provider record created successfully')
    }
    
    console.log('\n🎉 Dr. Watson user created successfully!')
    console.log('📧 Email: dr.watson@test.com')
    console.log('🔑 Password: password')
    console.log(`🆔 Auth ID: ${authUser.user.id}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createWatsonUser()