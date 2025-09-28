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

async function fixActiveSchedules() {
  try {
    const providerId = 'a44b32bb-00a5-460d-a18b-4468d59d0318'
    
    console.log('🔧 Checking and fixing active status on schedules...')
    
    // Test the EXACT query that auth-service.ts uses
    console.log('\n1. Testing exact auth-service query:')
    let scheduleQuery = supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .eq('active', true)
      .contains('treatment_types', ['weight_loss'])
    
    const { data: exactQuery, error: exactError } = await scheduleQuery
    
    if (exactError) {
      console.error('❌ Exact query error:', exactError)
    } else {
      console.log(`✅ Exact query found ${exactQuery.length} schedules`)
      if (exactQuery.length > 0) {
        console.log('Sample:', {
          day: exactQuery[0].day_of_week,
          time: `${exactQuery[0].start_time}-${exactQuery[0].end_time}`,
          active: exactQuery[0].active,
          treatment_types: exactQuery[0].treatment_types
        })
      }
    }
    
    // Check if schedules have active=true
    console.log('\n2. Checking active status:')
    const { data: allSchedules, error: allError } = await supabase
      .from('provider_schedules')
      .select('id, day_of_week, start_time, end_time, active, treatment_types')
      .eq('provider_id', providerId)
    
    if (allError) {
      console.error('❌ Error fetching all schedules:', allError)
    } else {
      console.log(`📅 Found ${allSchedules.length} total schedules:`)
      const activeCount = allSchedules.filter(s => s.active).length
      const inactiveCount = allSchedules.filter(s => !s.active).length
      console.log(`   Active: ${activeCount}, Inactive: ${inactiveCount}`)
      
      // Show first few schedules and their status
      allSchedules.slice(0, 3).forEach(schedule => {
        console.log(`   Day ${schedule.day_of_week}: ${schedule.start_time}-${schedule.end_time} Active:${schedule.active} Types:${JSON.stringify(schedule.treatment_types)}`)
      })
      
      // Set all schedules to active if needed
      if (inactiveCount > 0) {
        console.log('\n3. Setting all schedules to active...')
        const { error: updateError } = await supabase
          .from('provider_schedules')
          .update({ active: true })
          .eq('provider_id', providerId)
        
        if (updateError) {
          console.error('❌ Error updating schedules:', updateError)
        } else {
          console.log('✅ All schedules set to active')
        }
      }
    }
    
    // Final test
    console.log('\n4. Final test of exact auth-service query:')
    const { data: finalTest, error: finalError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .eq('active', true)
      .contains('treatment_types', ['weight_loss'])
    
    if (finalError) {
      console.error('❌ Final test error:', finalError)
    } else {
      console.log(`🎉 Final test: ${finalTest.length} active schedules with weight_loss`)
      if (finalTest.length > 0) {
        console.log('✅ The app should now find available times!')
      } else {
        console.log('❌ Still no results - there may be another issue')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixActiveSchedules()