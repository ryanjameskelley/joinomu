// Debug the provider query step by step
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugProviderQuery() {
  console.log('🐛 Debug Provider Query')
  console.log('=======================')

  const providerProfileId = '5edc937b-66d3-4aa4-9e16-166c17b86c56'

  // Step 1: Find provider record
  console.log('\n1️⃣ Finding provider record:')
  const { data: providers } = await supabase
    .from('providers')
    .select('*')
    .eq('profile_id', providerProfileId)

  console.log('Providers found:', providers)

  if (providers && providers.length > 0) {
    const providerId = providers[0].id
    console.log(`Provider ID: ${providerId}`)

    // Step 2: Find assignments for this provider
    console.log('\n2️⃣ Finding assignments for provider:')
    const { data: assignments } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('provider_id', providerId)

    console.log('Assignments found:', assignments)

    if (assignments && assignments.length > 0) {
      const patientId = assignments[0].patient_id
      console.log(`Patient ID: ${patientId}`)

      // Step 3: Find patient record
      console.log('\n3️⃣ Finding patient record:')
      const { data: patients } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)

      console.log('Patients found:', patients)

      if (patients && patients.length > 0) {
        const patientProfileId = patients[0].profile_id
        console.log(`Patient Profile ID: ${patientProfileId}`)

        // Step 4: Find profile record
        console.log('\n4️⃣ Finding profile record:')
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', patientProfileId)

        console.log('Profiles found:', profiles)
      }
    }
  }

  // Step 5: Try the manual join query like the function does
  console.log('\n5️⃣ Manual join query:')
  const { data: manualResult, error: manualError } = await supabase
    .from('patients')
    .select(`
      id,
      profile_id,
      phone,
      date_of_birth,
      has_completed_intake,
      created_at,
      profiles!patients_profile_id_fkey (
        first_name,
        last_name,
        email
      )
    `)
    .inner('patient_assignments', 'patient_assignments.patient_id', 'patients.id')
    .inner('providers', 'patient_assignments.provider_id', 'providers.id')
    .eq('providers.profile_id', providerProfileId)

  if (manualError) {
    console.log('❌ Manual query error:', manualError)
  } else {
    console.log('✅ Manual query result:', manualResult)
  }
}

debugProviderQuery().catch(console.error)