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

async function createWatsonUserDirect() {
  try {
    console.log('🔍 Checking if dr.watson@test.com already exists...')
    
    // Check profiles table first
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'dr.watson@test.com')
      .single()
    
    if (existingProfile && !checkError) {
      console.log('✅ Dr. Watson already exists in profiles:')
      console.log(`   ID: ${existingProfile.id}`)
      console.log(`   Email: ${existingProfile.email}`)
      console.log(`   Role: ${existingProfile.role}`)
      
      // Try to sign up with this existing profile ID
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: 'dr.watson@test.com',
        password: 'password',
        options: {
          data: {
            full_name: 'Dr. John Watson'
          }
        }
      })
      
      if (signupError) {
        console.error('❌ Error signing up existing user:', signupError.message)
        
        // Try to create user with admin API using existing ID
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
          email: 'dr.watson@test.com',
          password: 'password',
          email_confirm: true,
          user_metadata: {
            full_name: 'Dr. John Watson',
            user_id: existingProfile.id
          }
        })
        
        if (adminError) {
          console.error('❌ Admin create also failed:', adminError.message)
        } else {
          console.log('✅ Created auth user via admin API')
          console.log(`   Auth ID: ${adminData.user.id}`)
        }
      } else {
        console.log('✅ Signed up existing user successfully')
        console.log(`   Auth ID: ${signupData.user.id}`)
      }
      
      return
    }
    
    // User doesn't exist, create new one
    console.log('👤 Creating new dr.watson@test.com user...')
    const userId = uuidv4()
    console.log(`🔑 Generated UUID: ${userId}`)
    
    // Try simple signup first
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'dr.watson@test.com',
      password: 'password'
    })
    
    if (signupError) {
      console.error('❌ Signup error:', signupError.message)
      return
    }
    
    console.log('✅ User signup successful')
    console.log(`   Auth ID: ${signupData.user.id}`)
    console.log(`   Email: ${signupData.user.email}`)
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([
        {
          id: signupData.user.id,
          full_name: 'Dr. John Watson',
          email: 'dr.watson@test.com',
          role: 'provider'
        }
      ])
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
    } else {
      console.log('✅ Profile created')
    }
    
    // Create provider
    const { error: providerError } = await supabase
      .from('providers')
      .upsert([
        {
          id: signupData.user.id,
          name: 'Dr. John Watson',
          email: 'dr.watson@test.com',
          specialty: 'Family Medicine',
          license_number: 'MD123456',
          phone: '+1-555-0123',
          location: 'San Francisco, CA'
        }
      ])
    
    if (providerError) {
      console.error('❌ Provider error:', providerError)
    } else {
      console.log('✅ Provider record created')
    }
    
    console.log('\n🎉 Dr. Watson ready to login!')
    console.log('📧 Email: dr.watson@test.com')
    console.log('🔑 Password: password')
    console.log(`🆔 Auth ID: ${signupData.user.id}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createWatsonUserDirect()