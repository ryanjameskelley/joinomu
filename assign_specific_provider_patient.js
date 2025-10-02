// Assign provider 0b1b7d2e-7dc3-49dc-9806-6576bd36cbac to patient 1f43e557-998d-44ac-bc3b-910b94052691
process.env.VITE_SUPABASE_URL = 'https://yvgmjkljnqrgcpuduqwg.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Z21qa2xqbnFyZ2NwdWR1cXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyOTYxNDQsImV4cCI6MjA0Mjg3MjE0NH0.sBLvNrwQBw37zNl9IcGaM89CflEe9FNpPpwQjT3rLrA'

const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://yvgmjkljnqrgcpuduqwg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Z21qa2xqbnFyZ2NwdWR1cXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzI5NjE0NCwiZXhwIjoyMDQyODcyMTQ0fQ.0AQchbqA_vNYUxgAQU35vEZlEB9JNHJu3T7LlkDJSJM')

async function assignProviderToPatient() {
  try {
    console.log('🔍 Looking up provider and patient...')
    
    // Find provider by profile_id
    const { data: providerData, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('profile_id', '0b1b7d2e-7dc3-49dc-9806-6576bd36cbac')
      .single()
    
    if (providerError || !providerData) {
      console.error('❌ Provider not found:', providerError?.message || 'No data')
      return
    }
    
    console.log('✅ Found provider:', { id: providerData.id, name: `${providerData.first_name} ${providerData.last_name}` })
    
    // Find patient by profile_id
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', '1f43e557-998d-44ac-bc3b-910b94052691')
      .single()
    
    if (patientError || !patientData) {
      console.error('❌ Patient not found:', patientError?.message || 'No data')
      return
    }
    
    console.log('✅ Found patient:', { id: patientData.id, name: `${patientData.first_name} ${patientData.last_name}` })
    
    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('provider_id', providerData.id)
      .eq('patient_id', patientData.id)
      .eq('active', true)
      .single()
    
    if (existingAssignment) {
      console.log('ℹ️ Assignment already exists')
      return
    }
    
    // Create assignment
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('patient_assignments')
      .insert({
        provider_id: providerData.id,
        patient_id: patientData.id,
        treatment_type: 'weight_loss',
        is_primary: true,
        active: true,
        assigned_date: new Date().toISOString()
      })
      .select()
      .single()
    
    if (assignmentError) {
      console.error('❌ Assignment creation error:', assignmentError)
      return
    }
    
    console.log('✅ Successfully assigned provider to patient')
    console.log(`   Provider: ${providerData.first_name} ${providerData.last_name}`)
    console.log(`   Patient: ${patientData.first_name} ${patientData.last_name}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

assignProviderToPatient()