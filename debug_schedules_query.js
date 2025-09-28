const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugScheduleQuery() {
  console.log('🔍 Debugging provider_schedules query...')
  
  const providerId = 'eefb13eb-c40e-4fff-9dac-6225f6bfdf78' // Weight Loss provider ID
  
  try {
    // Test 1: Simple select all from provider_schedules
    console.log('\n1️⃣ Testing basic select all from provider_schedules...')
    const { data: allSchedules, error: allError } = await supabase
      .from('provider_schedules')
      .select('*')
    
    if (allError) {
      console.error('❌ Error on basic select:', allError)
      return
    }
    
    console.log(`✅ Basic select worked. Found ${allSchedules.length} total schedules`)
    allSchedules.forEach((schedule, index) => {
      console.log(`   ${index + 1}. Provider: ${schedule.provider_id}, Day: ${schedule.day_of_week}, Time: ${schedule.start_time}-${schedule.end_time}`)
    })
    
    // Test 2: Filter by provider_id
    console.log(`\n2️⃣ Testing filter by provider_id: ${providerId}`)
    const { data: providerSchedules, error: providerError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
    
    if (providerError) {
      console.error('❌ Error filtering by provider_id:', providerError)
      return
    }
    
    console.log(`✅ Provider filter worked. Found ${providerSchedules.length} schedules for this provider`)
    providerSchedules.forEach((schedule, index) => {
      console.log(`   ${index + 1}. Day: ${schedule.day_of_week}, Time: ${schedule.start_time}-${schedule.end_time}, Active: ${schedule.active}`)
    })
    
    // Test 3: Add active filter
    console.log(`\n3️⃣ Testing with active=true filter...`)
    const { data: activeSchedules, error: activeError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .eq('active', true)
    
    if (activeError) {
      console.error('❌ Error with active filter:', activeError)
      return
    }
    
    console.log(`✅ Active filter worked. Found ${activeSchedules.length} active schedules`)
    activeSchedules.forEach((schedule, index) => {
      console.log(`   ${index + 1}. Day: ${schedule.day_of_week}, Time: ${schedule.start_time}-${schedule.end_time}`)
      console.log(`      Treatment types: ${JSON.stringify(schedule.treatment_types)}`)
    })
    
    // Test 4: Treatment type filtering (the problematic query)
    console.log(`\n4️⃣ Testing treatment type filtering...`)
    const { data: treatmentSchedules, error: treatmentError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .eq('active', true)
      .contains('treatment_types', ['weight_loss'])
    
    if (treatmentError) {
      console.error('❌ Error with treatment type filter:', treatmentError)
      console.log('This might be the cause of the timeout!')
      return
    }
    
    console.log(`✅ Treatment type filter worked. Found ${treatmentSchedules.length} schedules`)
    treatmentSchedules.forEach((schedule, index) => {
      console.log(`   ${index + 1}. Day: ${schedule.day_of_week}, Treatment types: ${JSON.stringify(schedule.treatment_types)}`)
    })
    
  } catch (error) {
    console.error('❌ Exception during debugging:', error)
  }
}

debugScheduleQuery()