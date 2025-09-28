
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')

async function debugUserRole() {
  const userId = 'fe5fee47-896d-4ac7-ba2b-d35ef4589eee'
  
  // Check each table individually
  console.log('=== Checking admins table ===')
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('profile_id', userId)
  console.log('Admin data:', adminData, 'Error:', adminError)
  
  console.log('=== Checking providers table ===')
  const { data: providerData, error: providerError } = await supabase
    .from('providers')
    .select('*')
    .eq('profile_id', userId)
  console.log('Provider data:', providerData, 'Error:', providerError)
  
  console.log('=== Checking patients table ===')
  const { data: patientData, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('profile_id', userId)
  console.log('Patient data:', patientData, 'Error:', patientError)
}
debugUserRole()

