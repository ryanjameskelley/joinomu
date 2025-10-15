// Set environment variables for production Supabase
process.env.VITE_SUPABASE_URL = 'https://yvgmjkljnqrgcpuduqwg.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Z21qa2xqbnFyZ2NwdWR1cXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyOTYxNDQsImV4cCI6MjA0Mjg3MjE0NH0.sBLvNrwQBw37zNl9IcGaM89CflEe9FNpPpwQjT3rLrA'

const { supabase } = require('./shared/dist/config/supabase.js')

async function assignProviderToPatient() {
  try {
    console.log('🔍 Looking up provider user...')
    
    // Find provider
    const { data: providerData, error: providerError } = await supabase
      .from('providers')
      .select('id, first_name, last_name')
      .eq('user_id', '0b1b7d2e-7dc3-49dc-9806-6576bd36cbac')
      .single()
    
    if (providerError) {
      console.error('❌ Provider lookup error:', providerError)
      return
    }
    
    if (!providerData) {
      console.error('❌ Provider not found with user_id: 0b1b7d2e-7dc3-49dc-9806-6576bd36cbac')
      return
    }
    
    console.log('✅ Found provider:', providerData)
    
    console.log('🔍 Looking up patient user...')
    
    // Find patient
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, profile_id')
      .eq('profile_id', '1f43e557-998d-44ac-bc3b-910b94052691')
      .single()
    
    if (patientError) {
      console.error('❌ Patient lookup error:', patientError)
      return
    }
    
    if (!patientData) {
      console.error('❌ Patient not found with profile_id: 1f43e557-998d-44ac-bc3b-910b94052691')
      return
    }
    
    console.log('✅ Found patient:', patientData)
    
    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('provider_id', providerData.id)
      .eq('patient_id', patientData.id)
      .eq('active', true)
      .single()
    
    if (existingAssignment) {
      console.log('ℹ️ Assignment already exists:', existingAssignment)
      return
    }
    
    console.log('🔄 Creating patient assignment...')
    
    // Create assignment
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('patient_assignments')
      .insert({
        provider_id: providerData.id,
        patient_id: patientData.id,
        treatment_type: 'weight_loss', // Default treatment type
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
    
    console.log('✅ Successfully assigned provider to patient:')
    console.log(`   Provider: ${providerData.first_name} ${providerData.last_name} (ID: ${providerData.id})`)
    console.log(`   Patient: ${patientData.first_name} ${patientData.last_name} (ID: ${patientData.id})`)
    console.log(`   Assignment ID: ${assignmentData.id}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

assignProviderToPatient()