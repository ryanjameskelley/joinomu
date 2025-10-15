#!/usr/bin/env node

/**
 * Health Metrics Data Generator
 * Creates realistic health metrics data for existing patients in the database
 * 
 * Usage: node generate_health_metrics_data.js
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Determine which environment to use
const envArg = process.argv.find(arg => arg.startsWith('--env='))
const environment = envArg ? envArg.split('=')[1] : 'local'

let envPath
if (environment === 'local') {
  envPath = path.join(__dirname, 'apps/web/.env.local')
} else if (environment === 'staging') {
  envPath = path.join(__dirname, '.env.staging')
} else if (environment === 'production') {
  envPath = path.join(__dirname, '.env.production')
} else {
  envPath = path.join(__dirname, '.env')
}

console.log(`🌍 Using environment: ${environment}`)
console.log(`📁 Loading config from: ${envPath}`)

// Load environment variables
require('dotenv').config({ path: envPath })

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Could not load Supabase configuration')
  console.log('💡 Available environments: local, staging, production')
  console.log('📝 Usage: node generate_health_metrics_data.js --env=production')
  console.log(`📍 Tried loading from: ${envPath}`)
  process.exit(1)
}

// For local development, use the standard local service role key
let supabaseKey = supabaseAnonKey
let keyType = 'anon key'

if (environment === 'local' && supabaseUrl.includes('127.0.0.1')) {
  // Use the standard local Supabase service role key
  supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  keyType = 'service role (bypasses RLS)'
} else if (supabaseServiceKey && supabaseServiceKey.startsWith('eyJ')) {
  // Use provided service key if it looks like a proper JWT
  supabaseKey = supabaseServiceKey
  keyType = 'service role (bypasses RLS)'
}

console.log(`🔗 Connecting to Supabase at: ${supabaseUrl}`)
console.log(`🔑 Using ${keyType}`)
const supabase = createClient(supabaseUrl, supabaseKey)

// Health metric configurations with realistic ranges and patterns
const HEALTH_METRICS = {
  weight: {
    baseValue: 185, // lbs
    unit: 'lbs',
    dailyVariation: 2,
    weeklyTrend: -0.3, // Gradual weight loss
    seasonalFactor: 1.02, // Slight winter weight gain
    constraints: { min: 150, max: 250 }
  },
  steps: {
    baseValue: 8500,
    unit: 'steps',
    dailyVariation: 3000,
    weekendReduction: 0.7, // Less active on weekends
    constraints: { min: 2000, max: 20000 }
  },
  sleep: {
    baseValue: 7.5, // hours
    unit: 'hours',
    dailyVariation: 1.5,
    weekendIncrease: 1.2, // More sleep on weekends
    constraints: { min: 4, max: 12 }
  },
  heart_rate: {
    baseValue: 72, // bpm
    unit: 'bpm',
    dailyVariation: 8,
    fitnessImprovement: -0.1, // Heart rate improves over time
    constraints: { min: 50, max: 100 }
  },
  calories: {
    baseValue: 2200, // kcal
    unit: 'kcal',
    dailyVariation: 400,
    weekendIncrease: 1.15, // More calories on weekends
    constraints: { min: 1200, max: 3500 }
  },
  protein: {
    baseValue: 120, // grams
    unit: 'grams',
    dailyVariation: 30,
    workoutDayIncrease: 1.3, // More protein on workout days
    constraints: { min: 50, max: 200 }
  },
  sugar: {
    baseValue: 45, // grams
    unit: 'grams',
    dailyVariation: 20,
    weekendIncrease: 1.4, // More sugar on weekends
    constraints: { min: 10, max: 100 }
  },
  water: {
    baseValue: 64, // fl oz
    unit: 'fl oz',
    dailyVariation: 16,
    summerIncrease: 1.2, // More water in summer
    constraints: { min: 20, max: 120 }
  }
}

// Helper functions for realistic data generation
function getRandomVariation(baseValue, variation) {
  return baseValue + (Math.random() - 0.5) * 2 * variation
}

function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

function isWorkoutDay(date) {
  // Assume workout 4 days a week (Mon, Tue, Thu, Fri)
  const day = date.getDay()
  return [1, 2, 4, 5].includes(day)
}

function getSeason(date) {
  const month = date.getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'fall'
  return 'winter'
}

function generateMetricValue(metricType, date, dayIndex) {
  const config = HEALTH_METRICS[metricType]
  if (!config) throw new Error(`Unknown metric type: ${metricType}`)
  
  let value = config.baseValue
  
  // Apply daily variation
  value = getRandomVariation(value, config.dailyVariation)
  
  // Apply weekly trends
  if (config.weeklyTrend) {
    const weeksPassed = Math.floor(dayIndex / 7)
    value += weeksPassed * config.weeklyTrend
  }
  
  // Apply fitness improvement over time
  if (config.fitnessImprovement) {
    value += dayIndex * config.fitnessImprovement
  }
  
  // Apply weekend patterns
  if (isWeekend(date)) {
    if (config.weekendReduction) value *= config.weekendReduction
    if (config.weekendIncrease) value *= config.weekendIncrease
  }
  
  // Apply workout day patterns
  if (isWorkoutDay(date) && config.workoutDayIncrease) {
    value *= config.workoutDayIncrease
  }
  
  // Apply seasonal patterns
  const season = getSeason(date)
  if (season === 'summer' && config.summerIncrease) {
    value *= config.summerIncrease
  } else if (season === 'winter' && config.seasonalFactor) {
    value *= config.seasonalFactor
  }
  
  // Apply constraints
  if (config.constraints) {
    value = Math.max(config.constraints.min, Math.min(config.constraints.max, value))
  }
  
  // Round appropriately
  if (metricType === 'sleep') {
    return Math.round(value * 10) / 10 // One decimal place
  } else if (['weight'].includes(metricType)) {
    return Math.round(value * 10) / 10 // One decimal place
  } else {
    return Math.round(value) // Whole numbers
  }
}

async function generateHealthMetricsData(patientId, startDate, endDate) {
  const data = []
  const currentDate = new Date(startDate)
  let dayIndex = 0
  
  console.log(`📊 Generating health metrics data from ${startDate.toDateString()} to ${endDate.toDateString()}`)
  
  while (currentDate <= endDate) {
    // Generate 70% of days (simulate realistic tracking frequency)
    if (Math.random() < 0.7) {
      // Generate random subset of metrics for each day (1-4 metrics)
      const metricsToGenerate = Object.keys(HEALTH_METRICS)
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 4) + 1)
      
      for (const metricType of metricsToGenerate) {
        const value = generateMetricValue(metricType, currentDate, dayIndex)
        const config = HEALTH_METRICS[metricType]
        
        // Add some time variation throughout the day
        const timeVariation = Math.floor(Math.random() * 12) // 0-12 hours
        const recordedAt = new Date(currentDate)
        recordedAt.setHours(8 + timeVariation, Math.floor(Math.random() * 60))
        
        data.push({
          patient_id: patientId,
          metric_type: metricType,
          value: value,
          unit: config.unit,
          recorded_at: recordedAt.toISOString(),
          synced_from: 'manual',
          metadata: {
            generated: true,
            dayIndex: dayIndex,
            season: getSeason(currentDate),
            isWeekend: isWeekend(currentDate),
            isWorkoutDay: isWorkoutDay(currentDate)
          }
        })
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
    dayIndex++
  }
  
  return data
}

async function insertHealthMetrics(data) {
  const batchSize = 100
  let insertedCount = 0
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    
    const { error } = await supabase
      .from('patient_health_metrics')
      .insert(batch)
    
    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
    } else {
      insertedCount += batch.length
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)`)
    }
  }
  
  return insertedCount
}

async function authenticateUser() {
  // First, let's try to get any existing user from auth.users
  const { data: users, error: usersError } = await supabase
    .from('auth.users')
    .select('id, email')
    .limit(1)
  
  if (usersError) {
    console.log('⚠️ Could not query auth.users directly, trying alternative approach...')
    // Since we can't query auth.users directly, let's use the patient query to infer a user
    return null
  }
  
  if (users && users.length > 0) {
    console.log(`🔐 Found user: ${users[0].email}`)
    return users[0]
  }
  
  return null
}

async function getExistingPatients() {
  // Simple approach - try to query patients directly
  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, profile_id, created_at')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error fetching patients:', error)
    console.log('💡 This might be due to RLS policies.')
    console.log('🎯 Let\'s try using a known patient ID instead...')
    
    // Return a hardcoded patient ID if we can't query
    // You can replace this with an actual patient ID from your database
    return [{ 
      id: '61bd36ae-b0e6-402f-9c29-22f2d5e19a5b', // Replace with actual patient ID
      profile_id: 'example-profile-id',
      created_at: new Date().toISOString()
    }]
  }
  
  return patients || []
}

async function clearExistingTestData(patientId) {
  console.log('🧹 Clearing existing generated test data...')
  
  const { error } = await supabase
    .from('patient_health_metrics')
    .delete()
    .eq('patient_id', patientId)
    .eq('synced_from', 'manual')
  
  if (error) {
    console.error('❌ Error clearing existing data:', error)
  } else {
    console.log('✅ Cleared existing test data')
  }
}

async function main() {
  try {
    console.log('🔍 Looking for existing patients in the database...')
    
    // Check if a specific patient ID was provided
    const patientArg = process.argv.find(arg => arg.startsWith('--patient='))
    const specificPatientId = patientArg ? patientArg.split('=')[1] : null
    
    if (specificPatientId) {
      console.log(`🎯 Using specified patient ID: ${specificPatientId}`)
      const targetPatient = { id: specificPatientId, profile_id: 'manual', created_at: new Date().toISOString() }
      
      // Clear any existing test data for this patient
      await clearExistingTestData(targetPatient.id)
      
      // Continue with data generation
      await generateDataForPatient(targetPatient)
      return
    }
    
    const patients = await getExistingPatients()
    
    if (patients.length === 0) {
      console.error('❌ No patients found in database.')
      console.log('💡 You can specify a patient ID manually: --patient=your-patient-id')
      console.log('📝 Usage: node generate_health_metrics_data.js --patient=61bd36ae-b0e6-402f-9c29-22f2d5e19a5b')
      process.exit(1)
    }
    
    console.log(`👥 Found ${patients.length} patient(s):`)
    patients.forEach((patient, index) => {
      console.log(`   ${index + 1}. Patient ID: ${patient.id} (Profile: ${patient.profile_id})`)
    })
    
    // Use the first (most recent) patient
    const targetPatient = patients[0]
    console.log(`\n🎯 Using patient: ${targetPatient.id}`)
    
    // Clear any existing test data for this patient
    await clearExistingTestData(targetPatient.id)
    
    // Continue with data generation
    await generateDataForPatient(targetPatient)
    
  } catch (error) {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }
}

async function generateDataForPatient(targetPatient) {
  try {
    
    // Clear any existing test data for this patient
    await clearExistingTestData(targetPatient.id)
    
    // Generate data from start of year to present
    const endDate = new Date()
    const startDate = new Date(endDate.getFullYear(), 0, 1) // January 1st of current year
    
    console.log(`📅 Generating data from ${startDate.toDateString()} to ${endDate.toDateString()}`)
    
    // Generate the data
    const healthMetricsData = await generateHealthMetricsData(targetPatient.id, startDate, endDate)
    
    console.log(`\n📊 Generated ${healthMetricsData.length} health metric entries`)
    console.log('📈 Metrics breakdown:')
    
    // Show breakdown by metric type
    const breakdown = {}
    healthMetricsData.forEach(entry => {
      breakdown[entry.metric_type] = (breakdown[entry.metric_type] || 0) + 1
    })
    
    Object.entries(breakdown).forEach(([metric, count]) => {
      console.log(`   ${metric}: ${count} entries`)
    })
    
    // Insert into database
    console.log('\n💾 Inserting data into database...')
    const insertedCount = await insertHealthMetrics(healthMetricsData)
    
    console.log(`\n🎉 Successfully inserted ${insertedCount} health metric entries!`)
    console.log(`\n📋 Patient ID used: ${targetPatient.id}`)
    console.log('\n📝 Data characteristics:')
    console.log('   • Realistic daily variations')
    console.log('   • Weekend/weekday patterns (less steps, more sleep on weekends)')
    console.log('   • Seasonal adjustments (more water in summer)')
    console.log('   • Workout day variations (more protein on workout days)')
    console.log('   • Progressive trends (gradual weight loss, heart rate improvement)')
    console.log('   • ~70% tracking frequency (realistic gaps in data)')
    console.log('   • Time variations throughout the day')
    
    console.log('\n🎯 You can now test the health metrics charts with this realistic data!')
    
  } catch (error) {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = {
  generateHealthMetricsData,
  HEALTH_METRICS
}