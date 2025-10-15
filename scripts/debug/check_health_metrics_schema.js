const { createClient } = require('@supabase/supabase-js')

// Supabase connection
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMAs_-AdVY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  // First check what metric types already exist
  const { data: existingMetrics, error: existingError } = await supabase
    .from('patient_health_metrics')
    .select('metric_type, COUNT(*)')
    .eq('patient_id', 'd9bb10ad-eaa1-4188-ac4c-9bb58048d4c3')
  
  if (existingError) {
    console.error('Error checking existing metrics:', existingError)
  } else {
    console.log('Existing metrics in database:', existingMetrics)
  }
  
  // Check table structure by trying to insert a single test record
  const testRecord = {
    patient_id: 'd9bb10ad-eaa1-4188-ac4c-9bb58048d4c3',
    metric_type: 'protein',
    value: 100,
    unit: 'grams',
    recorded_at: new Date().toISOString(),
    synced_from: 'manual'
  }
  
  console.log('Testing insert with:', testRecord)
  
  const { data: testInsert, error: testError } = await supabase
    .from('patient_health_metrics')
    .insert([testRecord])
    .select()
  
  if (testError) {
    console.error('Test insert error:', testError)
  } else {
    console.log('Test insert successful:', testInsert)
    
    // Clean up the test record
    if (testInsert && testInsert.length > 0) {
      await supabase
        .from('patient_health_metrics')
        .delete()
        .eq('id', testInsert[0].id)
      console.log('Cleaned up test record')
    }
  }
}

checkSchema().catch(console.error)