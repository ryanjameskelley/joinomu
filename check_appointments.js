
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')

async function checkAppointments() {
  console.log('=== Sample Appointments ===')
  const { data: appointments, error } = await supabase.from('appointments').select('*').limit(5)
  console.log('Appointments:', appointments)
  
  console.log('
=== Sample Provider Schedules ===')
  const { data: schedules } = await supabase.from('provider_schedules').select('*').limit(5)
  console.log('Schedules:', schedules)
}

checkAppointments()

