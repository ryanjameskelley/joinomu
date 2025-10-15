
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')

async function testAnonKey() {
  const userId = 'fe5fee47-896d-4ac7-ba2b-d35ef4589eee'
  
  console.log('=== Testing with anon key (what app uses) ===')
  const { data: patientData, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('profile_id', userId)
    .single()
  console.log('Patient query with anon key:', patientData, patientError)
}
testAnonKey()

