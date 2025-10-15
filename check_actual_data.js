// Check what data is actually in the patient_health_metrics table
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkData() {
  const patientId = '419d8930-528f-4b7c-a2b0-3c62227c6bec'
  
  console.log('🔍 CHECKING ACTUAL DATABASE DATA')
  console.log('Patient ID:', patientId)
  console.log('=====================================')
  
  // Check total count
  const { count: totalCount } = await supabase
    .from('patient_health_metrics')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', patientId)
  
  console.log(`Total records for patient: ${totalCount}`)
  
  // Check weight data specifically (since that's what user mentioned)
  const { data: weightData, error: weightError } = await supabase
    .from('patient_health_metrics')
    .select('value, unit, recorded_at')
    .eq('patient_id', patientId)
    .eq('metric_type', 'weight')
    .order('recorded_at', { ascending: false })
    .limit(10)
  
  if (weightError) {
    console.error('Error fetching weight data:', weightError)
  } else {
    console.log('\n📊 WEIGHT DATA (most recent 10 records):')
    weightData.forEach((record, i) => {
      const date = new Date(record.recorded_at).toLocaleDateString()
      const time = new Date(record.recorded_at).toLocaleTimeString()
      console.log(`  ${i+1}. ${record.value} ${record.unit} on ${date} at ${time}`)
    })
  }
  
  // Check date range of all data
  const { data: dateRange } = await supabase
    .from('patient_health_metrics')
    .select('recorded_at')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: true })
    .limit(1)
  
  const { data: dateRangeEnd } = await supabase
    .from('patient_health_metrics')
    .select('recorded_at')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false })
    .limit(1)
  
  if (dateRange?.[0] && dateRangeEnd?.[0]) {
    const startDate = new Date(dateRange[0].recorded_at).toLocaleDateString()
    const endDate = new Date(dateRangeEnd[0].recorded_at).toLocaleDateString()
    console.log(`\n📅 DATE RANGE: ${startDate} to ${endDate}`)
  }
  
  // Check breakdown by metric type
  const { data: breakdown } = await supabase
    .from('patient_health_metrics')
    .select('metric_type')
    .eq('patient_id', patientId)
  
  if (breakdown) {
    const counts = breakdown.reduce((acc, row) => {
      acc[row.metric_type] = (acc[row.metric_type] || 0) + 1
      return acc
    }, {})
    
    console.log('\n📈 BREAKDOWN BY METRIC:')
    Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} records`)
      })
  }
  
  // Now check what the health metrics service would return
  console.log('\n🔍 TESTING HEALTH METRICS SERVICE QUERY')
  console.log('=====================================')
  
  // Simulate the same query that the frontend makes
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1) // 1 year ago
  const endDate = new Date()
  
  console.log(`Query range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`)
  
  const { data: serviceQuery, error: serviceError } = await supabase
    .from('patient_health_metrics')
    .select('*')
    .eq('patient_id', patientId)
    .eq('metric_type', 'weight')
    .gte('recorded_at', startDate.toISOString())
    .lte('recorded_at', endDate.toISOString())
    .order('recorded_at', { ascending: true })
  
  if (serviceError) {
    console.error('Service query error:', serviceError)
  } else {
    console.log(`Service query returned ${serviceQuery.length} weight records`)
    if (serviceQuery.length > 0) {
      console.log('First few records from service query:')
      serviceQuery.slice(0, 5).forEach((record, i) => {
        const date = new Date(record.recorded_at).toLocaleDateString()
        console.log(`  ${i+1}. ${record.value} ${record.unit} on ${date}`)
      })
    }
  }
}

checkData().catch(console.error)