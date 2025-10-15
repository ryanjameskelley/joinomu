// Check patient_assignments table structure
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function checkAssignmentsTable() {
  console.log('🔍 Checking patient_assignments table structure...')
  
  const { data: assignments, error } = await supabase
    .from('patient_assignments')
    .select('*')
    .limit(1)
  
  if (assignments && assignments.length > 0) {
    console.log('✅ Table columns:', Object.keys(assignments[0]))
  } else if (error) {
    console.log('❌ Error:', error)
  } else {
    console.log('⚠️ Table exists but is empty')
    // Try to insert with minimal fields to see what's required
    const { error: insertError } = await supabase
      .from('patient_assignments')
      .insert({
        patient_id: '00000000-0000-0000-0000-000000000000',
        provider_id: '00000000-0000-0000-0000-000000000001'
      })
    
    console.log('Insert test error (to see required fields):', insertError)
  }
}

checkAssignmentsTable().catch(console.error)
