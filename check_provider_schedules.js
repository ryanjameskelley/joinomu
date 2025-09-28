const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProviderSchedules() {
  console.log('🔍 Checking provider schedules...')
  
  // First get our Weight Loss and Mens Health providers
  const { data: providers, error: providerError } = await supabase
    .from('providers')
    .select('id, specialty')
    .in('specialty', ['Weight Loss', 'Mens Health'])
  
  if (providerError) {
    console.error('❌ Error getting providers:', providerError)
    return
  }
  
  console.log('✅ Found providers:', providers)
  
  // Check schedules for each provider
  for (const provider of providers) {
    console.log(`\n🔍 Checking schedules for ${provider.specialty} provider (${provider.id})`)
    
    const { data: schedules, error: scheduleError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', provider.id)
    
    if (scheduleError) {
      console.error('❌ Error getting schedules:', scheduleError)
      continue
    }
    
    if (schedules.length === 0) {
      console.log('   ⚠️ No schedules found for this provider')
    } else {
      console.log(`   ✅ Found ${schedules.length} schedule(s):`)
      schedules.forEach((schedule, index) => {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        console.log(`     ${index + 1}. ${dayNames[schedule.day_of_week]}: ${schedule.start_time} - ${schedule.end_time}`)
        console.log(`        Slot duration: ${schedule.slot_duration_minutes} minutes`)
        console.log(`        Treatment types: ${schedule.treatment_types || 'All'}`)
        console.log(`        Active: ${schedule.active}`)
      })
    }
    
    // Check availability overrides
    const { data: overrides, error: overrideError } = await supabase
      .from('provider_availability_overrides')
      .select('*')
      .eq('provider_id', provider.id)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
    
    if (overrideError) {
      console.error('❌ Error getting overrides:', overrideError)
    } else if (overrides.length > 0) {
      console.log(`   📅 Found ${overrides.length} availability override(s):`)
      overrides.forEach((override, index) => {
        console.log(`     ${index + 1}. ${override.date}: ${override.available ? 'Available' : 'Unavailable'}`)
        if (override.start_time && override.end_time) {
          console.log(`        Time: ${override.start_time} - ${override.end_time}`)
        }
        if (override.reason) {
          console.log(`        Reason: ${override.reason}`)
        }
      })
    } else {
      console.log('   📅 No availability overrides found')
    }
  }
}

checkProviderSchedules()