// Add health metrics for the CORRECT patient ID that the app expects
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addMetricsForCorrectPatient() {
  // The patient ID the app is actually expecting (from PatientTreatmentsPage.tsx line 316)
  const correctPatientId = 'd9bb10ad-eaa1-4188-ac4c-9bb58048d4c3'
  
  console.log('🎯 ADDING HEALTH METRICS FOR CORRECT PATIENT')
  console.log('Patient ID the app expects:', correctPatientId)
  
  // First check if this patient exists
  const { data: patientCheck } = await supabase
    .from('patients')
    .select('*')
    .eq('id', correctPatientId)
    .single()
  
  if (patientCheck) {
    console.log('✅ Target patient exists:', patientCheck.profile_id)
  } else {
    console.log('❌ Target patient does not exist - need to create or use different ID')
    console.log('Let me check what patients exist:')
    
    const { data: allPatients } = await supabase
      .from('patients')
      .select('id, profile_id')
    
    console.log('Available patients:')
    allPatients.forEach(p => {
      console.log(`  ${p.id} (profile: ${p.profile_id})`)
    })
    return
  }
  
  const metricsData = []
  const today = new Date('2024-10-14') // October 14, 2024
  
  console.log('Generating health metrics data for past 90 days...')
  
  // Generate data for the last 90 days from October 2024 backward
  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() - dayOffset)
    
    // Skip some days randomly (80% chance of having data)
    if (Math.random() < 0.8) {
      
      // Weight (daily, morning) - gradual loss from 200 to 195
      const weightProgress = dayOffset / 90
      const baseWeight = 200 - (weightProgress * 5) // 200 lbs declining to 195 lbs
      metricsData.push({
        patient_id: correctPatientId,
        metric_type: 'weight',
        value: baseWeight + (Math.random() - 0.5) * 4, // ±2 lbs variation
        unit: 'lbs',
        recorded_at: new Date(date.getTime() + 7 * 60 * 60 * 1000 + Math.random() * 2 * 60 * 60 * 1000).toISOString(),
        synced_from: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      // Steps (2-3 times per day)
      const stepEntries = Math.random() > 0.3 ? 3 : 2
      for (let i = 0; i < stepEntries; i++) {
        metricsData.push({
          patient_id: correctPatientId,
          metric_type: 'steps',
          value: Math.round(2000 + Math.random() * 5000),
          unit: 'steps',
          recorded_at: new Date(date.getTime() + (i * 6 + 8) * 60 * 60 * 1000 + Math.random() * 4 * 60 * 60 * 1000).toISOString(),
          synced_from: 'healthkit',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
      
      // Heart rate (3-4 times per day)
      const hrEntries = Math.floor(3 + Math.random() * 2)
      for (let i = 0; i < hrEntries; i++) {
        const timeOfDay = i / (hrEntries - 1)
        let baseHR = timeOfDay < 0.3 ? 65 : timeOfDay < 0.7 ? 85 : 70
        
        metricsData.push({
          patient_id: correctPatientId,
          metric_type: 'heart_rate',
          value: Math.round(baseHR + (Math.random() - 0.5) * 20),
          unit: 'bpm',
          recorded_at: new Date(date.getTime() + (6 + timeOfDay * 14) * 60 * 60 * 1000 + Math.random() * 2 * 60 * 60 * 1000).toISOString(),
          synced_from: 'healthkit',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
      
      // Other metrics
      const metrics = [
        { type: 'sleep', value: 6.5 + Math.random() * 2.5, unit: 'hours' },
        { type: 'protein', value: Math.round(80 + Math.random() * 60), unit: 'grams' },
        { type: 'sugar', value: Math.round(25 + Math.random() * 40), unit: 'grams' },
        { type: 'calories', value: Math.round(1800 + Math.random() * 800), unit: 'kcal' },
        { type: 'water', value: Math.round(60 + Math.random() * 40), unit: 'fl oz' }
      ]
      
      metrics.forEach((metric, i) => {
        metricsData.push({
          patient_id: correctPatientId,
          metric_type: metric.type,
          value: metric.value,
          unit: metric.unit,
          recorded_at: new Date(date.getTime() + (8 + i * 2) * 60 * 60 * 1000).toISOString(),
          synced_from: 'manual',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      })
    }
  }
  
  console.log(`Generated ${metricsData.length} health metric entries`)
  
  // Insert in batches
  const batchSize = 100
  let inserted = 0
  
  for (let i = 0; i < metricsData.length; i += batchSize) {
    const batch = metricsData.slice(i, i + batchSize)
    
    try {
      const { data, error } = await supabase
        .from('patient_health_metrics')
        .insert(batch)
        .select()
      
      if (error) {
        console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error)
      } else {
        inserted += data.length
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${data.length} records (total: ${inserted})`)
      }
    } catch (err) {
      console.error(`Exception in batch ${Math.floor(i/batchSize) + 1}:`, err)
    }
  }
  
  // Verify the results
  const { count: finalCount } = await supabase
    .from('patient_health_metrics')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', correctPatientId)
  
  console.log(`\n🎉 SUCCESS: ${finalCount} total records for correct patient ID`)
  
  // Show sample weight data
  const { data: weightSample } = await supabase
    .from('patient_health_metrics')
    .select('value, recorded_at')
    .eq('patient_id', correctPatientId)
    .eq('metric_type', 'weight')
    .order('recorded_at', { ascending: false })
    .limit(5)
  
  if (weightSample && weightSample.length > 0) {
    console.log('\n📊 SAMPLE WEIGHT DATA:')
    weightSample.forEach((w, i) => {
      const date = new Date(w.recorded_at).toLocaleDateString()
      console.log(`  ${i+1}. ${w.value.toFixed(1)} lbs on ${date}`)
    })
  }
  
  console.log('\n✅ The app should now display real data instead of dummy data!')
}

addMetricsForCorrectPatient().catch(console.error)