const { createClient } = require('@supabase/supabase-js')

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function fixProviderRole() {
  try {
    const providerId = '1ca238a9-9547-41fb-851e-8eb0dcb92c82'
    
    console.log('🔧 Fixing provider role and profile...')
    console.log(`   Provider ID: ${providerId}`)
    
    // Check current profile
    const { data: currentProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', providerId)
      .single()
    
    if (checkError) {
      console.log('❌ No existing profile, creating new one...')
      
      // Create profile with correct role
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: providerId,
            email: 'provider@test.com',
            role: 'provider'
          }
        ])
      
      if (insertError) {
        console.error('❌ Error creating profile:', insertError)
      } else {
        console.log('✅ Profile created with provider role')
      }
    } else {
      console.log('📋 Current profile:', currentProfile)
      
      // Update existing profile to ensure provider role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'provider' })
        .eq('id', providerId)
      
      if (updateError) {
        console.error('❌ Error updating profile:', updateError)
      } else {
        console.log('✅ Profile updated to provider role')
      }
    }
    
    // Ensure provider record exists
    const { data: providerRecord, error: providerCheckError } = await supabase
      .from('providers')
      .select('*')
      .eq('id', providerId)
      .single()
    
    if (providerCheckError) {
      console.log('🏥 Creating provider record...')
      
      const { error: providerInsertError } = await supabase
        .from('providers')
        .insert([
          {
            id: providerId,
            name: 'Dr. Test Provider',
            specialty: 'Family Medicine',
            license_number: 'MD789012',
            phone: '+1-555-0456',
            location: 'San Francisco, CA'
          }
        ])
      
      if (providerInsertError) {
        console.error('❌ Error creating provider record:', providerInsertError)
      } else {
        console.log('✅ Provider record created')
      }
    } else {
      console.log('✅ Provider record already exists')
    }
    
    console.log('\n🎉 Provider role fixed!')
    console.log('📧 Email: provider@test.com')
    console.log('🔑 Password: password')
    console.log('👨‍⚕️ Role: provider')
    console.log('\nYou should now be directed to the Provider Dashboard when logging in.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixProviderRole()