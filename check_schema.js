
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')

async function checkAppointmentSchema() {
  // Check appointments table structure
  console.log('=== Appointments Table Schema ===')
  const { data: appointments, error } = await supabase.rpc('get_table_schema', { table_name: 'appointments' })
  if (appointments) {
    appointments.forEach(col => console.log(col.column_name, col.data_type, col.is_nullable))
  }
  
  // Check provider_schedules table structure  
  console.log('
=== Provider Schedules Table Schema ===')
  const { data: schedules } = await supabase.rpc('get_table_schema', { table_name: 'provider_schedules' })
  if (schedules) {
    schedules.forEach(col => console.log(col.column_name, col.data_type, col.is_nullable))
  }
  
  // Check if there are any constraints or triggers
  console.log('
=== Sample Appointments ===')
  const { data: sampleAppts } = await supabase.from('appointments').select('*').limit(3)
  console.log(sampleAppts)
}

checkAppointmentSchema()

