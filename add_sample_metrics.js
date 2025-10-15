// Add sample metrics data using direct database insert
// This mimics what the Add Daily Metrics form does

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMAs_-AdVY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addSampleMetricsData() {
  const patientId = 'd9bb10ad-eaa1-4188-ac4c-9bb58048d4c3'
  
  console.log('Adding sample metrics for recent dates...')
  
  // Add data for the last 30 days to ensure it shows up in the chart
  const dates = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  
  const metricsData = []
  
  for (const dateStr of dates) {
    // Skip some days for realistic data
    if (Math.random() < 0.3) continue
    
    const dayIndex = dates.indexOf(dateStr)
    
    // Protein: 80-140 grams
    metricsData.push({
      patient_id: patientId,
      metric_type: 'protein',
      value: Math.round(100 + (Math.random() - 0.5) * 40),
      unit: 'grams',
      recorded_at: `${dateStr}T12:00:00.000Z`,
      synced_from: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    // Sugar: 25-65 grams  
    metricsData.push({
      patient_id: patientId,
      metric_type: 'sugar',
      value: Math.round(45 + (Math.random() - 0.5) * 20),
      unit: 'grams',
      recorded_at: `${dateStr}T12:00:00.000Z`,
      synced_from: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    // Water: 50-90 fl oz
    metricsData.push({
      patient_id: patientId,
      metric_type: 'water',
      value: Math.round(70 + (Math.random() - 0.5) * 20),
      unit: 'fl oz',
      recorded_at: `${dateStr}T12:00:00.000Z`,
      synced_from: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    // Heart rate: 65-85 bpm
    metricsData.push({
      patient_id: patientId,
      metric_type: 'heart_rate',
      value: Math.round(75 + (Math.random() - 0.5) * 10),
      unit: 'bpm',
      recorded_at: `${dateStr}T12:00:00.000Z`,
      synced_from: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  console.log(`Generated ${metricsData.length} metric entries for recent dates`)
  
  // Insert the data using upsert to avoid conflicts
  const { data, error } = await supabase
    .from('patient_health_metrics')
    .upsert(metricsData, {
      onConflict: 'patient_id,metric_type,recorded_at',
      ignoreDuplicates: false
    })
    .select()
  
  if (error) {
    console.error('Error inserting data:', error)
  } else {
    console.log(`✅ Successfully added ${data ? data.length : 0} metric entries`)
  }
  
  // Check what we have now
  const { data: counts, error: countError } = await supabase
    .from('patient_health_metrics')
    .select('metric_type')
    .eq('patient_id', patientId)
    .in('metric_type', ['protein', 'sugar', 'water', 'heart_rate'])
  
  if (countError) {
    console.error('Error counting:', countError)
  } else {
    const countsByType = counts.reduce((acc, row) => {
      acc[row.metric_type] = (acc[row.metric_type] || 0) + 1
      return acc
    }, {})
    console.log('Final counts by metric type:', countsByType)
  }
}

addSampleMetricsData().catch(console.error)