const { createClient } = require('@supabase/supabase-js')

// Supabase connection
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMAs_-AdVY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addMissingHealthMetrics() {
  const patientId = 'd9bb10ad-eaa1-4188-ac4c-9bb58048d4c3'
  
  // Generate realistic data for missing metric types over the past 9+ months
  const startDate = new Date('2024-01-18')
  const endDate = new Date('2024-10-14')
  
  const metricsToAdd = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    // Generate data for ~70% of days (realistic tracking frequency)
    if (Math.random() < 0.7) {
      const dateStr = currentDate.toISOString()
      
      // Protein (80-160 grams, trending up slightly as diet improves)
      const daysSinceStart = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24))
      const proteinBase = 90 + (daysSinceStart * 0.05) // Gradual improvement
      const protein = Math.max(60, Math.min(180, proteinBase + (Math.random() - 0.5) * 40))
      
      metricsToAdd.push({
        patient_id: patientId,
        metric_type: 'protein',
        value: Math.round(protein),
        unit: 'grams',
        recorded_at: dateStr,
        synced_from: 'manual'
      })
      
      // Sugar (20-80 grams, trending down as diet improves)
      const sugarBase = 60 - (daysSinceStart * 0.03) // Gradual improvement
      const sugar = Math.max(15, Math.min(100, sugarBase + (Math.random() - 0.5) * 30))
      
      metricsToAdd.push({
        patient_id: patientId,
        metric_type: 'sugar',
        value: Math.round(sugar),
        unit: 'grams',
        recorded_at: dateStr,
        synced_from: 'manual'
      })
      
      // Water (40-100 fl oz, trending up as health improves)
      const waterBase = 50 + (daysSinceStart * 0.02) // Gradual improvement
      const water = Math.max(32, Math.min(120, waterBase + (Math.random() - 0.5) * 20))
      
      metricsToAdd.push({
        patient_id: patientId,
        metric_type: 'water',
        value: Math.round(water),
        unit: 'fl oz',
        recorded_at: dateStr,
        synced_from: 'manual'
      })
      
      // Heart rate (60-85 bpm, trending down as fitness improves)
      const heartRateBase = 78 - (daysSinceStart * 0.01) // Gradual improvement
      const heartRate = Math.max(55, Math.min(90, heartRateBase + (Math.random() - 0.5) * 12))
      
      metricsToAdd.push({
        patient_id: patientId,
        metric_type: 'heart_rate',
        value: Math.round(heartRate),
        unit: 'bpm',
        recorded_at: dateStr,
        synced_from: 'manual'
      })
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  console.log(`Generated ${metricsToAdd.length} new health metric entries`)
  console.log(`Breakdown: ${metricsToAdd.length / 4} entries each for protein, sugar, water, heart_rate`)
  
  // Insert in batches of 100 to avoid overwhelming the database
  const batchSize = 100
  let inserted = 0
  
  for (let i = 0; i < metricsToAdd.length; i += batchSize) {
    const batch = metricsToAdd.slice(i, i + batchSize)
    
    const { data, error } = await supabase
      .from('patient_health_metrics')
      .insert(batch)
    
    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
    } else {
      inserted += batch.length
      console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(metricsToAdd.length / batchSize)} (${inserted}/${metricsToAdd.length} total)`)
    }
  }
  
  console.log(`✅ Successfully added ${inserted} new health metric entries`)
  
  // Verify the data was inserted
  const { data: verification, error: verifyError } = await supabase
    .from('patient_health_metrics')
    .select('metric_type, COUNT(*)')
    .eq('patient_id', patientId)
    .in('metric_type', ['protein', 'sugar', 'water', 'heart_rate'])
    .group('metric_type')
  
  if (verifyError) {
    console.error('Error verifying data:', verifyError)
  } else {
    console.log('✅ Verification - metric counts:', verification)
  }
}

addMissingHealthMetrics().catch(console.error)