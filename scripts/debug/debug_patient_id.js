const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugPatientRelationship() {
  console.log('🔍 Checking patient table structure...')
  
  // Check patients table
  const { data: patients, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .limit(3)
  
  console.log('📊 Patients table:')
  console.log('Error:', patientError)
  console.log('Sample patients:', patients)
  
  // Check profiles table 
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(3)
  
  console.log('\n📊 Profiles table:')
  console.log('Error:', profileError)
  console.log('Sample profiles:', profiles)
  
  if (patients && patients.length > 0 && profiles && profiles.length > 0) {
    console.log('\n🔍 Relationship analysis:')
    console.log('Patient profile_id:', patients[0].profile_id)
    console.log('Profile id:', profiles[0].id)
    console.log('Do they match?', patients[0].profile_id === profiles[0].id)
  }
}

debugPatientRelationship().then(() => {
  console.log('✅ Debug complete')
  process.exit(0)
}).catch(err => {
  console.error('❌ Debug failed:', err)
  process.exit(1)
})