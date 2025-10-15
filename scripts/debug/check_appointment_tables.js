const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAppointmentTables() {
  console.log('🔍 Checking for appointment/schedule related tables...')
  
  const tablesToCheck = [
    'provider_schedules',
    'provider_availability_overrides', 
    'appointments',
    'appointment_history'
  ]
  
  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table '${tableName}' does not exist or has error:`, error.message)
      } else {
        console.log(`✅ Table '${tableName}' exists`)
        if (data && data[0]) {
          console.log(`   Sample columns:`, Object.keys(data[0]))
        }
      }
    } catch (err) {
      console.log(`❌ Table '${tableName}' check failed:`, err.message)
    }
  }
  
  // Also check what tables DO exist
  console.log('\n🔍 Checking all existing tables...')
  try {
    const { data, error } = await supabase.rpc('get_schema_info')
    if (error) {
      console.log('Cannot get schema info via RPC, trying direct query...')
    }
  } catch (err) {
    console.log('RPC method not available')
  }
}

checkAppointmentTables()