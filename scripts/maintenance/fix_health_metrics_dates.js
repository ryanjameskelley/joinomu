// Fix health metrics dates - add data for 2024 instead of 2025
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDates() {
  const patientId = '419d8930-528f-4b7c-a2b0-3c62227c6bec'
  
  console.log('🔧 FIXING HEALTH METRICS DATES')
  console.log('Adding data for 2024 dates instead of 2025...')
  
  const metricsData = []
  const today = new Date('2024-10-14') // Set to October 2024
  
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
        patient_id: patientId,
        metric_type: 'weight',
        value: baseWeight + (Math.random() - 0.5) * 4, // ±2 lbs variation
        unit: 'lbs',
        recorded_at: new Date(date.getTime() + 7 * 60 * 60 * 1000 + Math.random() * 2 * 60 * 60 * 1000).toISOString(), // 7-9 AM
        synced_from: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      // Steps (2-3 times per day)
      const stepEntries = Math.random() > 0.3 ? 3 : 2
      for (let i = 0; i < stepEntries; i++) {
        metricsData.push({
          patient_id: patientId,
          metric_type: 'steps',
          value: Math.round(2000 + Math.random() * 5000), // 2000-7000 steps per entry
          unit: 'steps',
          recorded_at: new Date(date.getTime() + (i * 6 + 8) * 60 * 60 * 1000 + Math.random() * 4 * 60 * 60 * 1000).toISOString(),
          synced_from: 'healthkit',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
      
      // Heart rate (3-5 times per day)
      const hrEntries = Math.floor(3 + Math.random() * 3)
      for (let i = 0; i < hrEntries; i++) {
        const timeOfDay = i / (hrEntries - 1) // 0 to 1
        let baseHR
        if (timeOfDay < 0.3) baseHR = 65 // Morning resting
        else if (timeOfDay < 0.7) baseHR = 85 // Daytime active  
        else baseHR = 70 // Evening
        
        metricsData.push({
          patient_id: patientId,
          metric_type: 'heart_rate',
          value: Math.round(baseHR + (Math.random() - 0.5) * 20), // ±10 bpm variation
          unit: 'bpm',
          recorded_at: new Date(date.getTime() + (6 + timeOfDay * 14) * 60 * 60 * 1000 + Math.random() * 2 * 60 * 60 * 1000).toISOString(),
          synced_from: 'healthkit',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
      
      // Other metrics (protein, sugar, calories, sleep)
      metricsData.push({
        patient_id: patientId,
        metric_type: 'sleep',
        value: 6.5 + Math.random() * 2.5, // 6.5-9 hours
        unit: 'hours',
        recorded_at: new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString(), // 8 AM
        synced_from: 'healthkit',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      metricsData.push({
        patient_id: patientId,
        metric_type: 'protein',
        value: Math.round(80 + Math.random() * 60), // 80-140g
        unit: 'grams',
        recorded_at: new Date(date.getTime() + 12 * 60 * 60 * 1000).toISOString(), // Noon
        synced_from: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      metricsData.push({
        patient_id: patientId,
        metric_type: 'sugar',
        value: Math.round(25 + Math.random() * 40), // 25-65g
        unit: 'grams',
        recorded_at: new Date(date.getTime() + 14 * 60 * 60 * 1000).toISOString(), // 2 PM
        synced_from: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }
  
  console.log(`Generated ${metricsData.length} health metric entries for 2024 dates`)
  
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
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${data.length} records (total: ${inserted})`)
      }
    } catch (err) {
      console.error(`Exception in batch ${Math.floor(i/batchSize) + 1}:`, err)
    }
  }
  
  // Verify the date range now
  const { data: dateCheck } = await supabase
    .from('patient_health_metrics')
    .select('recorded_at')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: true })
    .limit(1)
  
  const { data: dateCheckEnd } = await supabase
    .from('patient_health_metrics')
    .select('recorded_at')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false })
    .limit(1)
  
  if (dateCheck?.[0] && dateCheckEnd?.[0]) {
    const startDate = new Date(dateCheck[0].recorded_at).toLocaleDateString()
    const endDate = new Date(dateCheckEnd[0].recorded_at).toLocaleDateString()
    console.log(`\n✅ NEW DATE RANGE: ${startDate} to ${endDate}`)
  }
  
  console.log('🎉 SUCCESS: Added health metrics with correct 2024 dates!')
}

fixDates().catch(console.error)