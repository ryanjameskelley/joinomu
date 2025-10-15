// Debug what patient data the frontend should be seeing
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugPatientData() {
  console.log('🔍 DEBUGGING PATIENT DATA LOADING')
  console.log('==================================')
  
  // Check what patients exist and their profile_ids
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (patientsError) {
    console.error('Error fetching patients:', patientsError)
    return
  }
  
  console.log('📋 ALL PATIENTS IN DATABASE:')
  patients.forEach((patient, i) => {
    console.log(`  ${i+1}. Patient:`, JSON.stringify(patient, null, 2))
    console.log('')
  })
  
  // Check which patients have health metrics data
  console.log('📊 PATIENTS WITH HEALTH METRICS DATA:')
  for (const patient of patients) {
    const { count } = await supabase
      .from('patient_health_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patient.id)
    
    if (count > 0) {
      console.log(`✅ Patient ${patient.id}: ${count} records`)
      
      // Show sample weight data for this patient
      const { data: weightSample } = await supabase
        .from('patient_health_metrics')
        .select('value, recorded_at')
        .eq('patient_id', patient.id)
        .eq('metric_type', 'weight')
        .order('recorded_at', { ascending: false })
        .limit(3)
      
      if (weightSample && weightSample.length > 0) {
        console.log('   Recent weight data:')
        weightSample.forEach(w => {
          const date = new Date(w.recorded_at).toLocaleDateString()
          console.log(`     ${w.value.toFixed(1)} lbs on ${date}`)
        })
      }
    } else {
      console.log(`❌ Patient ${patient.id}: 0 records`)
    }
  }
  
  // Test the exact query that the frontend should be making
  console.log('\n🔬 TESTING FRONTEND QUERY SIMULATION')
  console.log('===================================')
  
  const targetPatientId = '419d8930-528f-4b7c-a2b0-3c62227c6bec'
  const targetProfileId = '6a2ffaa8-318b-4888-a102-1277708d6b9a'
  
  console.log(`Target Patient ID: ${targetPatientId}`)
  console.log(`Target Profile ID: ${targetProfileId}`)
  
  // Check if this patient exists
  const { data: targetPatient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', targetPatientId)
    .single()
  
  if (targetPatient) {
    console.log('✅ Target patient exists in database')
    console.log(`   Profile ID match: ${targetPatient.profile_id === targetProfileId ? '✅' : '❌'}`)
    console.log(`   Expected: ${targetProfileId}`)
    console.log(`   Actual: ${targetPatient.profile_id}`)
  } else {
    console.log('❌ Target patient does not exist in database')
  }
  
  // Test the health metrics service query directly
  console.log('\n🧪 SIMULATING HEALTH METRICS SERVICE CALL')
  
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1) // 1 year ago
  const endDate = new Date()
  
  console.log(`Query parameters:`)
  console.log(`  Patient ID: ${targetPatientId}`)
  console.log(`  Metric Type: weight`)
  console.log(`  Start Date: ${startDate.toISOString()}`)
  console.log(`  End Date: ${endDate.toISOString()}`)
  
  const { data: queryResult, error: queryError } = await supabase
    .from('patient_health_metrics')
    .select('*')
    .eq('patient_id', targetPatientId)
    .eq('metric_type', 'weight')
    .gte('recorded_at', startDate.toISOString())
    .lte('recorded_at', endDate.toISOString())
    .order('recorded_at', { ascending: true })
  
  if (queryError) {
    console.error('❌ Query failed:', queryError)
  } else {
    console.log(`✅ Query returned ${queryResult.length} weight records`)
    if (queryResult.length > 0) {
      console.log('Sample results:')
      queryResult.slice(0, 5).forEach((record, i) => {
        const date = new Date(record.recorded_at).toLocaleDateString()
        console.log(`  ${i+1}. ${record.value.toFixed(1)} lbs on ${date}`)
      })
    }
  }
}

debugPatientData().catch(console.error)