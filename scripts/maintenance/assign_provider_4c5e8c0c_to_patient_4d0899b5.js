// Direct assignment using Supabase client
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://yvgmjkljnqrgcpuduqwg.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Z21qa2xqbnFyZ2NwdWR1cXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzI5NjE0NCwiZXhwIjoyMDQyODcyMTQ0fQ.0AQchbqA_vNYUxgAQU35vEZlEB9JNHJu3T7LlkDJSJM'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function assignProviderToPatient() {
  try {
    console.log('🔍 Looking up provider and patient...')
    
    // Find provider by profile_id (auth uid: 4c5e8c0c-e391-4ec5-a479-d7ef253894e1)
    const { data: providerData, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('profile_id', '4c5e8c0c-e391-4ec5-a479-d7ef253894e1')
      .single()
    
    if (providerError || !providerData) {
      console.error('❌ Provider not found:', providerError?.message || 'No data')
      return
    }
    
    console.log('✅ Found provider:', { 
      id: providerData.id, 
      profile_id: providerData.profile_id,
      name: `${providerData.first_name} ${providerData.last_name}` 
    })
    
    // Find patient by profile_id (auth uid: 4d0899b5-9814-46dc-aace-dfcf046d5587)
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', '4d0899b5-9814-46dc-aace-dfcf046d5587')
      .single()
    
    if (patientError || !patientData) {
      console.error('❌ Patient not found:', patientError?.message || 'No data')
      return
    }
    
    console.log('✅ Found patient:', { 
      id: patientData.id, 
      profile_id: patientData.profile_id,
      name: `${patientData.first_name} ${patientData.last_name}` 
    })
    
    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('provider_id', providerData.id)
      .eq('patient_id', patientData.id)
      .single()
    
    if (existingAssignment) {
      console.log('ℹ️ Assignment already exists:', existingAssignment)
      return
    }
    
    // Create assignment
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('patient_assignments')
      .insert({
        provider_id: providerData.id,
        patient_id: patientData.id,
        status: 'active',
        assigned_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (assignmentError) {
      console.error('❌ Assignment creation error:', assignmentError)
      return
    }
    
    console.log('✅ Successfully assigned provider to patient')
    console.log(`   Provider: ${providerData.first_name} ${providerData.last_name} (${providerData.id})`)
    console.log(`   Patient: ${patientData.first_name} ${patientData.last_name} (${patientData.id})`)
    console.log('   Assignment ID:', assignmentData.id)
    
    // Verify assignment exists
    const { data: verifyAssignment, error: verifyError } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('provider_id', providerData.id)
      .eq('patient_id', patientData.id)
      .single()
    
    if (verifyError || !verifyAssignment) {
      console.error('❌ Verification failed:', verifyError?.message || 'No assignment found')
      return
    }
    
    console.log('✅ Assignment verified successfully')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

assignProviderToPatient()