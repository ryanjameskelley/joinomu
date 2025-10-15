// Add health metrics data directly to database without migration
// This will add approximately 500 records without deleting any existing data

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addHealthMetrics() {
  const patientId = '419d8930-528f-4b7c-a2b0-3c62227c6bec'
  
  console.log('Adding approximately 500 health metrics records...')
  console.log('Patient ID:', patientId)
  
  const metricsData = []
  const today = new Date()
  
  // Generate data for the last 90 days with multiple entries per day
  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() - dayOffset)
    
    // Skip some days randomly (80% chance of having data)
    if (Math.random() < 0.8) {
      
      // Weight (daily, morning)
      metricsData.push({
        patient_id: patientId,
        metric_type: 'weight',
        value: 195 + (Math.random() - 0.5) * 6, // 192-198 lbs range
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
      
      // Sleep (once per night)
      metricsData.push({
        patient_id: patientId,
        metric_type: 'sleep',
        value: 6.5 + Math.random() * 2.5, // 6.5-9 hours
        unit: 'hours',
        recorded_at: new Date(date.getTime() + 8 * 60 * 60 * 1000 + Math.random() * 2 * 60 * 60 * 1000).toISOString(), // 8-10 AM
        synced_from: 'healthkit',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      // Calories (2-3 meal entries)
      const calorieEntries = Math.random() > 0.4 ? 3 : 2
      for (let i = 0; i < calorieEntries; i++) {
        metricsData.push({
          patient_id: patientId,
          metric_type: 'calories',
          value: Math.round(400 + Math.random() * 800), // 400-1200 calories per meal
          unit: 'kcal',
          recorded_at: new Date(date.getTime() + (7 + i * 5) * 60 * 60 * 1000 + Math.random() * 3 * 60 * 60 * 1000).toISOString(),
          synced_from: 'manual',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
      
      // Protein (2-3 meal entries)  
      for (let i = 0; i < calorieEntries; i++) {
        metricsData.push({
          patient_id: patientId,
          metric_type: 'protein',
          value: Math.round(20 + Math.random() * 40), // 20-60g per meal
          unit: 'grams',
          recorded_at: new Date(date.getTime() + (7 + i * 5) * 60 * 60 * 1000 + Math.random() * 3 * 60 * 60 * 1000).toISOString(),
          synced_from: 'manual',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
      
      // Sugar (2-4 entries per day)
      const sugarEntries = Math.floor(2 + Math.random() * 3)
      for (let i = 0; i < sugarEntries; i++) {
        metricsData.push({
          patient_id: patientId,
          metric_type: 'sugar',
          value: Math.round(10 + Math.random() * 30), // 10-40g per entry
          unit: 'grams',
          recorded_at: new Date(date.getTime() + (8 + i * 4) * 60 * 60 * 1000 + Math.random() * 2 * 60 * 60 * 1000).toISOString(),
          synced_from: 'manual',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
      
      // Exercise minutes (40% of days)
      if (Math.random() < 0.4) {
        metricsData.push({
          patient_id: patientId,
          metric_type: 'exercise_minutes',
          value: Math.round(20 + Math.random() * 60), // 20-80 minutes
          unit: 'minutes',
          recorded_at: new Date(date.getTime() + 17 * 60 * 60 * 1000 + Math.random() * 4 * 60 * 60 * 1000).toISOString(), // 5-9 PM
          synced_from: 'healthkit',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }
  }
  
  console.log(`Generated ${metricsData.length} health metric entries`)
  
  // Insert in batches to avoid overwhelming the database
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
  
  // Verify what we have now
  const { data: finalCount, error: countError } = await supabase
    .from('patient_health_metrics')
    .select('metric_type', { count: 'exact' })
    .eq('patient_id', patientId)
  
  if (countError) {
    console.error('Error counting final records:', countError)
  } else {
    console.log(`✅ SUCCESS: Total records now in database for patient: ${finalCount.length}`)
  }
  
  // Show breakdown by metric type
  const { data: breakdown, error: breakdownError } = await supabase
    .from('patient_health_metrics')
    .select('metric_type')
    .eq('patient_id', patientId)
  
  if (!breakdownError && breakdown) {
    const counts = breakdown.reduce((acc, row) => {
      acc[row.metric_type] = (acc[row.metric_type] || 0) + 1
      return acc
    }, {})
    
    console.log('\n📊 BREAKDOWN BY METRIC TYPE:')
    Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} records`)
      })
  }
}

addHealthMetrics().catch(console.error)