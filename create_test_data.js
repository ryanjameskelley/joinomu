#!/usr/bin/env node

/**
 * Simple Test Data Creator
 * Creates a test patient and realistic health metrics data
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'apps/web/.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Could not load Supabase configuration')
  process.exit(1)
}

console.log(`🔗 Connecting to Supabase at: ${supabaseUrl}`)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Simple health metric generator
function generateWeightData(startDate, days = 30) {
  const data = []
  let baseWeight = 185 // Starting weight
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    // Skip some days randomly (70% tracking frequency)
    if (Math.random() > 0.7) continue
    
    // Gradual weight loss with daily variation
    baseWeight -= 0.1 + (Math.random() - 0.5) * 2
    const weight = Math.max(150, Math.min(220, baseWeight))
    
    // Random time during the day
    date.setHours(7 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60))
    
    data.push({
      metric_type: 'weight',
      value: Math.round(weight * 10) / 10,
      unit: 'lbs',
      recorded_at: date.toISOString(),
      synced_from: 'manual'
    })
  }
  
  return data
}

function generateStepsData(startDate, days = 30) {
  const data = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    // Skip some days randomly
    if (Math.random() > 0.6) continue
    
    // Base steps with weekend reduction
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    let steps = 8000 + Math.floor(Math.random() * 5000)
    if (isWeekend) steps *= 0.7
    
    date.setHours(20 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60))
    
    data.push({
      metric_type: 'steps',
      value: Math.floor(steps),
      unit: 'steps',
      recorded_at: date.toISOString(),
      synced_from: 'manual'
    })
  }
  
  return data
}

function generateSleepData(startDate, days = 30) {
  const data = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    // Skip some days randomly
    if (Math.random() > 0.8) continue
    
    // Base sleep with weekend increase
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    let sleep = 7 + Math.random() * 2.5
    if (isWeekend) sleep += 0.5
    
    date.setHours(8 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60))
    
    data.push({
      metric_type: 'sleep',
      value: Math.round(sleep * 10) / 10,
      unit: 'hours',
      recorded_at: date.toISOString(),
      synced_from: 'manual'
    })
  }
  
  return data
}

function generateCaloriesData(startDate, days = 30) {
  const data = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    // Skip some days randomly
    if (Math.random() > 0.5) continue
    
    // Base calories with weekend increase
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    let calories = 2000 + Math.floor(Math.random() * 600)
    if (isWeekend) calories *= 1.15
    
    date.setHours(18 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60))
    
    data.push({
      metric_type: 'calories',
      value: Math.floor(calories),
      unit: 'kcal',
      recorded_at: date.toISOString(),
      synced_from: 'manual'
    })
  }
  
  return data
}

async function createTestPatient() {
  // Create a simple patient record
  const patientId = crypto.randomUUID()
  
  const { data, error } = await supabase
    .from('patient_health_metrics')
    .insert([{
      patient_id: patientId,
      metric_type: 'weight',
      value: 185.0,
      unit: 'lbs',
      recorded_at: new Date().toISOString(),
      synced_from: 'manual'
    }])
    .select()
  
  if (error) {
    console.error('❌ Error creating test entry:', error)
    return null
  }
  
  console.log(`✅ Created test patient: ${patientId}`)
  return patientId
}

async function insertHealthMetrics(patientId, metrics) {
  const dataWithPatientId = metrics.map(metric => ({
    ...metric,
    patient_id: patientId
  }))
  
  const { data, error } = await supabase
    .from('patient_health_metrics')
    .insert(dataWithPatientId)
  
  if (error) {
    console.error('❌ Error inserting health metrics:', error)
    return 0
  }
  
  return dataWithPatientId.length
}

async function main() {
  try {
    console.log('🎯 Creating test patient and health metrics data...')
    
    // Create or get a patient ID
    const patientId = await createTestPatient()
    if (!patientId) {
      console.error('❌ Failed to create test patient')
      process.exit(1)
    }
    
    // Generate data for the last 30 days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    console.log(`📅 Generating data from ${startDate.toDateString()} to ${new Date().toDateString()}`)
    
    // Generate different types of health metrics
    const weightData = generateWeightData(startDate, 30)
    const stepsData = generateStepsData(startDate, 30)
    const sleepData = generateSleepData(startDate, 30)
    const caloriesData = generateCaloriesData(startDate, 30)
    
    const allMetrics = [...weightData, ...stepsData, ...sleepData, ...caloriesData]
    
    console.log(`📊 Generated ${allMetrics.length} health metric entries:`)
    console.log(`   Weight: ${weightData.length} entries`)
    console.log(`   Steps: ${stepsData.length} entries`)
    console.log(`   Sleep: ${sleepData.length} entries`)
    console.log(`   Calories: ${caloriesData.length} entries`)
    
    // Insert all metrics
    console.log('\n💾 Inserting data into database...')
    const insertedCount = await insertHealthMetrics(patientId, allMetrics)
    
    console.log(`\n🎉 Successfully inserted ${insertedCount} health metric entries!`)
    console.log(`📋 Patient ID: ${patientId}`)
    console.log('\n🎯 You can now test the health metrics charts!')
    console.log('💡 Try switching between different metrics to see both line charts (weight) and bar charts (others)')
    
  } catch (error) {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}