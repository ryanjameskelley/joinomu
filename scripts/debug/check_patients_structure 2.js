// Check patients table structure
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function checkPatientsStructure() {
  console.log('🔍 Checking patients table structure...')
  
  // Get a sample patient to see the structure
  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .limit(1)
  
  if (patients && patients.length > 0) {
    console.log('✅ Patients table columns:', Object.keys(patients[0]))
  } else {
    console.log('⚠️ No patients found or error:', error)
  }
  
  // Now check if trigger exists
  const { data: triggerTest } = await supabase
    .from('auth_trigger_logs')
    .select('*')
    .limit(1)
  
  console.log('✅ Auth trigger logs table exists:', !!triggerTest)
  
  // Try to manually create the user profile
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: '2be9df1b-b453-4586-b0c6-7739b4ca56a8',
        role: 'patient',
        email: 'example@test.com',
        first_name: 'Test',
        last_name: 'Patient'
      })
      .select()
    
    if (profileError) {
      console.log('Profile creation error:', profileError)
    } else {
      console.log('✅ Profile created manually')
    }
    
    // Now create patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({
        profile_id: '2be9df1b-b453-4586-b0c6-7739b4ca56a8',
        date_of_birth: '1990-01-01',
        has_completed_intake: false
      })
      .select()
    
    if (patientError) {
      console.log('Patient creation error:', patientError)
    } else {
      console.log('✅ Patient created manually')
    }
    
  } catch (err) {
    console.log('Manual creation error:', err)
  }
}

checkPatientsStructure().catch(console.error)