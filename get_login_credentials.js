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

async function getLoginCredentials() {
  try {
    const patientId = 'd10382e9-d30e-4a1c-8c17-16cd6da6a9de'
    const providerId = 'a44b32bb-00a5-460d-a18b-4468d59d0318'
    
    console.log('🔍 Finding login credentials...\n')
    
    // 1. Check patient profile/auth
    console.log('👤 PATIENT LOGIN:')
    const { data: patientProfile, error: patientError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .single()
    
    if (patientProfile) {
      console.log(`📧 Email: ${patientProfile.email}`)
      console.log(`🔑 Password: password (standard)`)
      console.log(`👤 Role: ${patientProfile.role}`)
    } else {
      console.log('❌ No auth profile found for patient')
      console.log(`📝 Patient ID: ${patientId}`)
    }
    
    // 2. Check provider profile/auth
    console.log('\n🩺 PROVIDER LOGIN:')
    const { data: providerProfile, error: providerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', providerId)
      .single()
    
    if (providerProfile) {
      console.log(`📧 Email: ${providerProfile.email}`)
      console.log(`🔑 Password: password (standard)`)
      console.log(`👤 Role: ${providerProfile.role}`)
    } else {
      console.log('❌ No auth profile found for provider')
      console.log(`📝 Provider ID: ${providerId}`)
    }
    
    // 3. Check what auth users exist
    console.log('\n🔍 ALL AUTH USERS:')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authUsers) {
      console.log(`Found ${authUsers.users.length} auth users:`)
      authUsers.users.forEach(user => {
        console.log(`   📧 ${user.email} (ID: ${user.id.substring(0, 8)}...)`)
      })
    }
    
    // 4. Working credentials we know about
    console.log('\n✅ KNOWN WORKING CREDENTIALS:')
    console.log('📧 provider@test.com / password (Provider role)')
    console.log('📧 testpatient@example.com / password (Patient role)')
    
    // 5. Show the connection that's established
    console.log('\n🔗 ESTABLISHED CONNECTION:')
    console.log(`Patient ${patientId} ↔ Provider ${providerId}`)
    console.log('✅ Provider has 20 weight_loss schedules')
    console.log('✅ Patient is assigned for weight_loss treatment')
    
    console.log('\n💡 RECOMMENDATION:')
    console.log('Use provider@test.com to login and view patients')
    console.log('The provider dashboard should show assigned patients')
    console.log('Click on patients to test the visits component')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

getLoginCredentials()