const { createClient } = require('@supabase/supabase-js')

// Local Supabase connection
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createPatientAssignment() {
  const patientId = 'f152e8c7-2eb5-4132-86e6-db00104e1e78'
  const providerId = '7a67c32b-ebe2-44fb-b9cf-078c35f4ad0d'
  
  console.log('🔗 Creating patient assignment...')
  console.log('Patient ID:', patientId)
  console.log('Provider ID:', providerId)
  
  try {
    // First, verify the patient and provider exist
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', patientId)
      .single()
    
    if (!patient) {
      console.error('❌ Patient not found with profile_id:', patientId)
      return
    }
    
    const { data: provider } = await supabase
      .from('providers')
      .select('*')
      .eq('profile_id', providerId)
      .single()
    
    if (!provider) {
      console.error('❌ Provider not found with profile_id:', providerId)
      return
    }
    
    console.log('✅ Found patient:', patient.first_name, patient.last_name)
    console.log('✅ Found provider:', provider.first_name, provider.last_name)
    
    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('provider_id', provider.id)
      .single()
    
    if (existingAssignment) {
      console.log('✅ Patient assignment already exists:', existingAssignment.id)
      return existingAssignment
    }
    
    // Create the patient assignment
    const { data: assignment, error } = await supabase
      .from('patient_assignments')
      .insert({
        patient_id: patient.id,
        provider_id: provider.id,
        assigned_date: new Date().toISOString(),
        is_primary: true,
        treatment_type: 'weight_loss'
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error creating patient assignment:', error)
      return
    }
    
    console.log('✅ Created patient assignment:', assignment)
    return assignment
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createPatientAssignment()