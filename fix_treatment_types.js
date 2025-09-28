const { createClient } = require('@supabase/supabase-js')

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function fixTreatmentTypes() {
  try {
    const providerId = 'a44b32bb-00a5-460d-a18b-4468d59d0318'
    
    console.log('🔧 Fixing treatment_types for provider schedules...')
    
    // Get all schedules for this provider
    const { data: schedules, error: schedulesError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
    
    if (schedulesError) {
      console.error('❌ Error fetching schedules:', schedulesError)
      return
    }
    
    console.log(`📅 Found ${schedules.length} schedules to update`)
    
    // Update each schedule to include weight_loss in treatment_types
    for (const schedule of schedules) {
      const { error: updateError } = await supabase
        .from('provider_schedules')
        .update({ 
          treatment_types: ['weight_loss'] // Array of treatment types
        })
        .eq('id', schedule.id)
      
      if (updateError) {
        console.error(`❌ Error updating schedule ${schedule.id}:`, updateError)
      } else {
        console.log(`✅ Updated schedule: Day ${schedule.day_of_week}, ${schedule.start_time}-${schedule.end_time}`)
      }
    }
    
    console.log('\n🎉 All schedules updated with treatment_types: ["weight_loss"]')
    console.log('🔄 The app should now find available times for weight loss appointments')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixTreatmentTypes()