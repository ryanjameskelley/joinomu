const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')

async function examineAvailabilityTables() {
  console.log('=== provider_schedules table ===')
  const { data: schedules, error: schedError } = await supabase.from('provider_schedules').select('*').limit(3)
  console.log('Schedules:', schedules)
  console.log('Error:', schedError)
  
  console.log('\n=== provider_availability_summary table ===')
  const { data: summary, error: summError } = await supabase.from('provider_availability_summary').select('*').limit(3)
  console.log('Summary:', summary)
  console.log('Error:', summError)
  
  console.log('\n=== provider_availability_overrides table ===')
  const { data: overrides, error: overError } = await supabase.from('provider_availability_overrides').select('*').limit(3)
  console.log('Overrides:', overrides)
  console.log('Error:', overError)
  
  // Check the structure of each table
  console.log('\n=== Table Structures ===')
  
  if (schedules && schedules.length > 0) {
    console.log('provider_schedules fields:', Object.keys(schedules[0]))
  }
  
  if (summary && summary.length > 0) {
    console.log('provider_availability_summary fields:', Object.keys(summary[0]))
  }
  
  if (overrides && overrides.length > 0) {
    console.log('provider_availability_overrides fields:', Object.keys(overrides[0]))
  }
}

examineAvailabilityTables()