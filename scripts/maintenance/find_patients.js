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

async function findPatients() {
  try {
    console.log('🔍 Looking for available patients...')
    
    // Find all patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(10)
    
    if (patientsError) {
      console.error('❌ Error finding patients:', patientsError)
      return
    }
    
    console.log(`📋 Found ${patients.length} patients:`)
    patients.forEach((patient, index) => {
      console.log(`   ${index + 1}. ${patient.name} (${patient.id})`)
    })
    
    // Also check profiles for the test user ID
    const { data: testProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'fe5fee47-896d-4ac7-ba2b-d35ef4589eee')
      .single()
    
    if (testProfile) {
      console.log(`\n✅ Found test user profile: ${testProfile.email} (${testProfile.role})`)
    } else {
      console.log('\n❌ Test user profile not found')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

findPatients()