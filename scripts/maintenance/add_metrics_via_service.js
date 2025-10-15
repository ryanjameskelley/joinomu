// Use the same health metrics service that the app uses
const { healthMetricsService } = require('./shared/dist/index.js')

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
        patientId: patientId,
        metricType: 'protein',
        value: Math.round(protein),
        unit: 'grams',
        recordedAt: dateStr,
        syncedFrom: 'manual'
      })
      
      // Sugar (20-80 grams, trending down as diet improves)
      const sugarBase = 60 - (daysSinceStart * 0.03) // Gradual improvement
      const sugar = Math.max(15, Math.min(100, sugarBase + (Math.random() - 0.5) * 30))
      
      metricsToAdd.push({
        patientId: patientId,
        metricType: 'sugar',
        value: Math.round(sugar),
        unit: 'grams',
        recordedAt: dateStr,
        syncedFrom: 'manual'
      })
      
      // Water (40-100 fl oz, trending up as health improves)
      const waterBase = 50 + (daysSinceStart * 0.02) // Gradual improvement
      const water = Math.max(32, Math.min(120, waterBase + (Math.random() - 0.5) * 20))
      
      metricsToAdd.push({
        patientId: patientId,
        metricType: 'water',
        value: Math.round(water),
        unit: 'fl oz',
        recordedAt: dateStr,
        syncedFrom: 'manual'
      })
      
      // Heart rate (60-85 bpm, trending down as fitness improves)
      const heartRateBase = 78 - (daysSinceStart * 0.01) // Gradual improvement
      const heartRate = Math.max(55, Math.min(90, heartRateBase + (Math.random() - 0.5) * 12))
      
      metricsToAdd.push({
        patientId: patientId,
        metricType: 'heart_rate',
        value: Math.round(heartRate),
        unit: 'bpm',
        recordedAt: dateStr,
        syncedFrom: 'manual'
      })
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  console.log(`Generated ${metricsToAdd.length} new health metric entries`)
  console.log(`Breakdown: ${metricsToAdd.length / 4} entries each for protein, sugar, water, heart_rate`)
  
  // Use the health metrics service to add them in batches
  const result = await healthMetricsService.addBatchEntries(metricsToAdd)
  
  console.log('Batch insert result:', result)
  
  if (result.success) {
    console.log(`✅ Successfully added ${result.saved} new health metric entries`)
  } else {
    console.log('❌ Some errors occurred:', result.errors)
  }
}

addMissingHealthMetrics().catch(console.error)