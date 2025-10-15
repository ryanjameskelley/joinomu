#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'apps/web/.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
// Use service role key to bypass RLS
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkHealthData() {
  console.log('🔍 Checking health metrics data...')
  
  // Get the patient ID we've been using
  const patientId = '4c3c0e97-7074-4bc0-97b6-654bcfa584a5'
  
  // Query all weight data for this patient from Jan 1, 2025
  const { data, error } = await supabase
    .from('patient_health_metrics')
    .select('*')
    .eq('patient_id', patientId)
    .eq('metric_type', 'weight')
    .gte('recorded_at', '2025-01-01T00:00:00.000Z')
    .order('recorded_at', { ascending: true })
  
  if (error) {
    console.error('❌ Error querying data:', error)
    return
  }
  
  console.log(`📊 Found ${data.length} weight entries for patient ${patientId}`)
  console.log('\n📅 Weight data entries:')
  
  data.forEach((entry, index) => {
    const date = new Date(entry.recorded_at)
    const dateStr = date.toISOString().split('T')[0]
    console.log(`${index + 1}. ${dateStr} - ${entry.value} ${entry.unit} (recorded: ${entry.recorded_at})`)
  })
  
  if (data.length > 0) {
    const firstDate = new Date(data[0].recorded_at).toISOString().split('T')[0]
    const lastDate = new Date(data[data.length - 1].recorded_at).toISOString().split('T')[0]
    console.log(`\n📈 Date range: ${firstDate} to ${lastDate}`)
  }
  
  // Also check all metric types for this patient
  console.log('\n🔍 Checking all metric types...')
  const { data: allData, error: allError } = await supabase
    .from('patient_health_metrics')
    .select('metric_type, recorded_at')
    .eq('patient_id', patientId)
    .gte('recorded_at', '2025-01-01T00:00:00.000Z')
    .order('recorded_at', { ascending: true })
  
  if (!allError && allData) {
    const metricCounts = {}
    allData.forEach(entry => {
      metricCounts[entry.metric_type] = (metricCounts[entry.metric_type] || 0) + 1
    })
    
    console.log('\n📊 Metric type breakdown:')
    Object.entries(metricCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} entries`)
    })
    
    console.log(`\n📊 Total entries: ${allData.length}`)
  }
}

checkHealthData().catch(console.error)