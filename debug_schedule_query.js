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

async function debugScheduleQuery() {
  try {
    const providerId = 'a44b32bb-00a5-460d-a18b-4468d59d0318'
    
    console.log('🔍 Debugging schedule query...')
    console.log(`   Provider ID: ${providerId}`)
    
    // 1. Check if provider exists
    console.log('\n1. Checking if provider exists...')
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('id', providerId)
      .single()
    
    if (providerError) {
      console.error('❌ Provider not found:', providerError.message)
    } else {
      console.log('✅ Provider found:', provider)
    }
    
    // 2. Check schedules without any filters
    console.log('\n2. Checking all schedules for provider...')
    const { data: allSchedules, error: allSchedulesError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
    
    if (allSchedulesError) {
      console.error('❌ Error querying schedules:', allSchedulesError.message)
    } else {
      console.log(`✅ Found ${allSchedules.length} schedules:`)
      allSchedules.forEach(schedule => {
        console.log(`   Day ${schedule.day_of_week}: ${schedule.start_time} - ${schedule.end_time}`)
      })
    }
    
    // 3. Check schedules with treatment type filter (this is probably the issue)
    console.log('\n3. Checking schedules with weight_loss filter...')
    const { data: filteredSchedules, error: filteredError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .eq('treatment_type', 'weight_loss')
    
    if (filteredError) {
      console.error('❌ Error with treatment type filter:', filteredError.message)
    } else {
      console.log(`✅ Found ${filteredSchedules.length} schedules with weight_loss filter`)
    }
    
    // 4. Check table schema to see if treatment_type column exists
    console.log('\n4. Checking provider_schedules table schema...')
    const { data: schema, error: schemaError } = await supabase
      .from('provider_schedules')
      .select('*')
      .limit(1)
    
    if (schema && schema.length > 0) {
      console.log('✅ Schema columns:', Object.keys(schema[0]))
    }
    
    // 5. If schedules exist but treatment filter fails, add treatment_type to schedules
    if (allSchedules.length > 0 && (!filteredSchedules || filteredSchedules.length === 0)) {
      console.log('\n5. Adding treatment_type to existing schedules...')
      
      for (const schedule of allSchedules) {
        const { error: updateError } = await supabase
          .from('provider_schedules')
          .update({ treatment_type: 'weight_loss' })
          .eq('id', schedule.id)
        
        if (updateError) {
          console.error('❌ Error updating schedule:', updateError.message)
        } else {
          console.log(`✅ Updated schedule for day ${schedule.day_of_week}`)
        }
      }
      
      console.log('🔄 Schedules updated with treatment_type: weight_loss')
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error)
  }
}

debugScheduleQuery()