
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')

async function examineOverrides() {
  // Try to get all overrides
  const { data: overrides } = await supabase.from('provider_availability_overrides').select('*')
  console.log('All overrides:', overrides)
  
  // Create a sample override to see the structure
  const sampleOverride = {
    provider_id: 'a44b32bb-00a5-460d-a18b-4468d59d0318',
    date: '2025-09-27',
    start_time: '14:00:00',
    end_time: '15:00:00',
    is_available: false,
    reason: 'Test override'
  }
  
  console.log('Attempting to insert sample override to understand structure...')
  const { data: inserted, error } = await supabase
    .from('provider_availability_overrides')
    .insert(sampleOverride)
    .select()
  
  console.log('Insert result:', { inserted, error })
}

examineOverrides()

