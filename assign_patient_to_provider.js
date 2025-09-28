// Assign patient to provider with minimal fields
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function assignPatientToProvider() {
  const patientProfileId = '76077268-2ba0-4921-be19-a71b75ebcdfa'
  const providerProfileId = '01a7078f-34cb-4a31-96ff-59023f1f4b9e'
  
  console.log('🔍 Assigning patient to provider...')
  console.log('Patient profile ID:', patientProfileId)
  console.log('Provider profile ID:', providerProfileId)
  
  try {
    // First, get the patient's internal ID
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('profile_id', patientProfileId)
      .single()
    
    if (patientError || !patient) {
      console.log('❌ Patient not found:', patientError)
      return
    }
    
    console.log('✅ Patient internal ID:', patient.id)
    
    // Get the provider's internal ID
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('profile_id', providerProfileId)
      .single()
    
    if (providerError || !provider) {
      console.log('❌ Provider not found:', providerError)
      return
    }
    
    console.log('✅ Provider internal ID:', provider.id)
    
    // Create the assignment with minimal fields
    const { data: assignment, error: assignmentError } = await supabase
      .from('patient_assignments')
      .insert({
        patient_id: patient.id,
        provider_id: provider.id
      })
      .select()
    
    if (assignmentError) {
      console.log('❌ Assignment error:', assignmentError)
      return
    }
    
    console.log('✅ Patient assigned to provider successfully!')
    console.log('Assignment details:', assignment)
    
    // Verify the assignment
    const { data: verification, error: verifyError } = await supabase
      .from('patient_assignments')
      .select(`
        *,
        patients!inner(profile_id),
        providers!inner(profile_id)
      `)
      .eq('patient_id', patient.id)
      .eq('provider_id', provider.id)
    
    if (verification && verification.length > 0) {
      console.log('✅ Assignment verified!')
      console.log('Patient profile ID:', verification[0].patients.profile_id)
      console.log('Provider profile ID:', verification[0].providers.profile_id)
    } else {
      console.log('⚠️ Could not verify assignment')
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

assignPatientToProvider().catch(console.error)
