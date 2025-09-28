const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')

async function checkBookingSystem() {
  console.log('=== Sample Appointments ===')
  const { data: appointments, error } = await supabase.from('appointments').select('*').limit(3)
  console.log('Appointments:', appointments)
  console.log('Error:', error)
  
  console.log('\n=== Sample Provider Schedules ===')
  const { data: schedules } = await supabase.from('provider_schedules').select('*').limit(3)
  console.log('Schedules:', schedules)
  
  console.log('\n=== Checking for booking conflicts ===')
  // See if there are any unique constraints or logic
  console.log('Looking at how availability is managed...')
  
  // Check if there's a specific slot booking mechanism
  const { data: slots } = await supabase.from('provider_schedules')
    .select('*')
    .eq('slot_date', '2025-09-27')  // tomorrow
    .limit(2)
  console.log('Tomorrow slots:', slots)
}

checkBookingSystem()