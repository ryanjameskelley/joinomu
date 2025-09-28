
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')

async function getTableSchema() {
  // Query the information schema to get column details
  const { data, error } = await supabase.rpc('sql', {
    query: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'provider_availability_overrides'
      ORDER BY ordinal_position;
    `
  })
  
  console.log('provider_availability_overrides schema:')
  console.log(data)
  console.log('Error:', error)
}

getTableSchema()

