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
      .eq('user_id', 'b0fe1e12-3dce-4952-bfee-b374d85fd485')
      .single()
    
    if (providerError) {
      console.error('❌ Provider lookup error:', providerError)
      return
    }
    
    if (!providerData) {
      console.error('❌ Provider not found with user_id: b0fe1e12-3dce-4952-bfee-b374d85fd485')
      return
    }
    
    console.log('✅ Found provider:', providerData)
    
    console.log('🔍 Looking up patient user...')
    
    // Find patient
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, profile_id')
      .eq('profile_id', '0e00dc93-9582-44b6-9803-f1ba893902eb')
      .single()
    
    if (patientError) {
      console.error('❌ Patient lookup error:', patientError)
      return
    }
    
    if (!patientData) {
      console.error('❌ Patient not found with profile_id: 0e00dc93-9582-44b6-9803-f1ba893902eb')
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