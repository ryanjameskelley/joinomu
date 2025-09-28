const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createProviderSchedules() {
  console.log('🔍 Creating comprehensive provider schedules...')
  
  // Get our Weight Loss and Mens Health providers
  const { data: providers, error: providerError } = await supabase
    .from('providers')
    .select('id, specialty')
    .in('specialty', ['Weight Loss', 'Mens Health'])
  
  if (providerError) {
    console.error('❌ Error getting providers:', providerError)
    return
  }
  
  console.log('✅ Found providers:', providers)
  
  // Create comprehensive schedules for both providers
  const scheduleTemplate = [
    // Monday - Friday business hours
    { day_of_week: 1, start_time: '08:00:00', end_time: '12:00:00', slot_duration_minutes: 30 }, // Monday morning
    { day_of_week: 1, start_time: '13:00:00', end_time: '17:00:00', slot_duration_minutes: 30 }, // Monday afternoon
    { day_of_week: 1, start_time: '18:00:00', end_time: '20:00:00', slot_duration_minutes: 30 }, // Monday evening
    
    { day_of_week: 2, start_time: '08:00:00', end_time: '12:00:00', slot_duration_minutes: 30 }, // Tuesday morning
    { day_of_week: 2, start_time: '13:00:00', end_time: '17:00:00', slot_duration_minutes: 30 }, // Tuesday afternoon
    { day_of_week: 2, start_time: '18:00:00', end_time: '20:00:00', slot_duration_minutes: 30 }, // Tuesday evening
    
    { day_of_week: 3, start_time: '08:00:00', end_time: '12:00:00', slot_duration_minutes: 30 }, // Wednesday morning
    { day_of_week: 3, start_time: '13:00:00', end_time: '17:00:00', slot_duration_minutes: 30 }, // Wednesday afternoon
    { day_of_week: 3, start_time: '18:00:00', end_time: '20:00:00', slot_duration_minutes: 30 }, // Wednesday evening
    
    { day_of_week: 4, start_time: '08:00:00', end_time: '12:00:00', slot_duration_minutes: 30 }, // Thursday morning
    { day_of_week: 4, start_time: '13:00:00', end_time: '17:00:00', slot_duration_minutes: 30 }, // Thursday afternoon
    { day_of_week: 4, start_time: '18:00:00', end_time: '20:00:00', slot_duration_minutes: 30 }, // Thursday evening
    
    { day_of_week: 5, start_time: '08:00:00', end_time: '12:00:00', slot_duration_minutes: 30 }, // Friday morning
    { day_of_week: 5, start_time: '13:00:00', end_time: '17:00:00', slot_duration_minutes: 30 }, // Friday afternoon
    { day_of_week: 5, start_time: '18:00:00', end_time: '20:00:00', slot_duration_minutes: 30 }, // Friday evening
  ]
  
  for (const provider of providers) {
    console.log(`\n🔄 Creating schedules for ${provider.specialty} provider...`)
    
    // Clear existing schedules first
    await supabase
      .from('provider_schedules')
      .delete()
      .eq('provider_id', provider.id)
    
    // Create new schedules
    const schedulesToInsert = scheduleTemplate.map(schedule => ({
      provider_id: provider.id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      slot_duration_minutes: schedule.slot_duration_minutes,
      treatment_types: provider.specialty === 'Weight Loss' ? ['weight_loss'] : ['mens_health'],
      active: true
    }))
    
    const { data: insertedSchedules, error: insertError } = await supabase
      .from('provider_schedules')
      .insert(schedulesToInsert)
      .select()
    
    if (insertError) {
      console.error(`❌ Error creating schedules for ${provider.specialty}:`, insertError)
      continue
    }
    
    console.log(`✅ Created ${insertedSchedules.length} schedule blocks for ${provider.specialty} provider`)
    
    // Show summary
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const schedulesByDay = {}
    
    insertedSchedules.forEach(schedule => {
      const day = dayNames[schedule.day_of_week]
      if (!schedulesByDay[day]) schedulesByDay[day] = []
      schedulesByDay[day].push(`${schedule.start_time.slice(0,5)} - ${schedule.end_time.slice(0,5)}`)
    })
    
    Object.entries(schedulesByDay).forEach(([day, times]) => {
      console.log(`   ${day}: ${times.join(', ')}`)
    })
  }
  
  console.log('\n🎉 Provider schedules created successfully!')
  console.log('📅 Both providers now have comprehensive availability:')
  console.log('   - Monday-Friday: 8:00 AM - 12:00 PM, 1:00 PM - 5:00 PM, 6:00 PM - 8:00 PM')
  console.log('   - 30-minute appointment slots')
  console.log('   - Treatment-specific filtering enabled')
  console.log('\n🔄 Now update the authService.getAvailableSlots() to use the real database!')
}

createProviderSchedules()