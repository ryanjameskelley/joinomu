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

async function useExistingPatient() {
  try {
    const providerWithSchedulesId = 'a44b32bb-00a5-460d-a18b-4468d59d0318' // Provider with 20 schedules
    
    console.log('🔍 Finding existing patients and connecting one to our provider...')
    
    // 1. Find existing patients
    console.log('\n1. Finding existing patients...')
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .limit(5)
    
    if (patientError) {
      console.error('❌ Error getting patients:', patientError)
      return
    }
    
    if (!patients || patients.length === 0) {
      console.log('❌ No patients found')
      return
    }
    
    console.log(`✅ Found ${patients.length} existing patients:`)
    patients.forEach(patient => {
      console.log(`   ID: ${patient.id}`)
    })
    
    // Use the first patient
    const selectedPatient = patients[0]
    console.log(`\n🎯 Selected patient: ${selectedPatient.id}`)
    
    // 2. Create assignment between this patient and our provider
    console.log('\n2. Creating patient assignment...')
    const { error: assignError } = await supabase
      .from('patient_assignments')
      .upsert([
        {
          patient_id: selectedPatient.id,
          provider_id: providerWithSchedulesId,
          treatment_type: 'weight_loss',
          assigned_date: new Date().toISOString().split('T')[0],
          is_primary: true
        }
      ])
    
    if (assignError) {
      console.error('❌ Error creating assignment:', assignError)
    } else {
      console.log('✅ Patient assignment created')
    }
    
    // 3. Verify the connection
    console.log('\n3. Verifying connection...')
    
    // Check assignment exists
    const { data: assignments } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('patient_id', selectedPatient.id)
      .eq('treatment_type', 'weight_loss')
    
    console.log(`✅ Patient has ${assignments?.length || 0} weight_loss assignments`)
    
    // Check provider schedules
    const { data: schedules } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerWithSchedulesId)
      .eq('active', true)
      .contains('treatment_types', ['weight_loss'])
    
    console.log(`✅ Provider has ${schedules?.length || 0} weight_loss schedules`)
    
    // 4. Get this patient's auth info from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', selectedPatient.id)
      .single()
    
    console.log('\n🎉 Setup complete!')
    console.log('\n📋 LOGIN CREDENTIALS:')
    if (profile) {
      console.log(`📧 Email: ${profile.email}`)
      console.log('🔑 Password: password (try this)')
    } else {
      console.log(`📧 Patient ID: ${selectedPatient.id}`)
      console.log('🔑 No profile found - may need to create auth user')
    }
    
    console.log('\n🧪 TESTING:')
    console.log('1. Login with the patient credentials')
    console.log('2. Weight loss provider should now show available appointment times')
    console.log('3. The provider has 20+ time slots available across the week')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

useExistingPatient()