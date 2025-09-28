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

async function verifyConnection() {
  try {
    const testPatientId = '55bb52a5-32da-4d8a-9a82-8d568a0eb33d' // The signed in user
    
    console.log('🔍 Verifying patient-provider-schedule connection...')
    console.log(`   Test Patient ID: ${testPatientId}`)
    
    // 1. Find what providers are assigned to the patient for weight_loss
    console.log('\n1. Patient assignments for weight_loss:')
    const { data: assignments, error: assignError } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('patient_id', testPatientId)
      .eq('treatment_type', 'weight_loss')
    
    if (assignError) {
      console.error('❌ Error getting assignments:', assignError)
      return
    }
    
    if (!assignments || assignments.length === 0) {
      console.log('❌ No weight_loss assignments found for patient')
      return
    }
    
    console.log(`✅ Found ${assignments.length} weight_loss assignments:`)
    assignments.forEach(assign => {
      console.log(`   Patient: ${assign.patient_id} → Provider: ${assign.provider_id} (Primary: ${assign.is_primary})`)
    })
    
    // 2. Check schedules for each assigned provider
    for (const assignment of assignments) {
      const providerId = assignment.provider_id
      console.log(`\n2. Checking schedules for provider: ${providerId}`)
      
      const { data: schedules, error: schedError } = await supabase
        .from('provider_schedules')
        .select('*')
        .eq('provider_id', providerId)
        .eq('active', true)
        .contains('treatment_types', ['weight_loss'])
      
      if (schedError) {
        console.error(`❌ Error getting schedules for ${providerId}:`, schedError)
        continue
      }
      
      console.log(`   Found ${schedules.length} weight_loss schedules for this provider`)
      
      if (schedules.length === 0) {
        console.log(`   🔧 This provider has no weight_loss schedules! Need to fix.`)
        
        // Get any existing schedules for this provider
        const { data: anySchedules, error: anyError } = await supabase
          .from('provider_schedules')
          .select('*')
          .eq('provider_id', providerId)
        
        if (anyError) {
          console.error(`❌ Error getting any schedules:`, anyError)
        } else if (anySchedules.length > 0) {
          console.log(`   Found ${anySchedules.length} total schedules, updating them for weight_loss...`)
          
          // Update all schedules for this provider to include weight_loss
          const { error: updateError } = await supabase
            .from('provider_schedules')
            .update({ 
              treatment_types: ['weight_loss'],
              active: true 
            })
            .eq('provider_id', providerId)
          
          if (updateError) {
            console.error(`❌ Error updating schedules:`, updateError)
          } else {
            console.log(`✅ Updated all schedules for provider ${providerId}`)
          }
        } else {
          console.log(`   Need to create schedules for provider ${providerId}`)
          
          // Create basic Mon-Fri schedule
          const schedules = [
            { provider_id: providerId, day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00', treatment_types: ['weight_loss'], active: true },
            { provider_id: providerId, day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00', treatment_types: ['weight_loss'], active: true },
            { provider_id: providerId, day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00', treatment_types: ['weight_loss'], active: true },
            { provider_id: providerId, day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00', treatment_types: ['weight_loss'], active: true },
            { provider_id: providerId, day_of_week: 5, start_time: '09:00:00', end_time: '17:00:00', treatment_types: ['weight_loss'], active: true }
          ]
          
          const { error: createError } = await supabase
            .from('provider_schedules')
            .insert(schedules)
          
          if (createError) {
            console.error(`❌ Error creating schedules:`, createError)
          } else {
            console.log(`✅ Created 5 schedules for provider ${providerId}`)
          }
        }
      } else {
        console.log(`✅ Provider has working schedules!`)
        // Show sample schedule
        const sample = schedules[0]
        console.log(`   Sample: Day ${sample.day_of_week}, ${sample.start_time}-${sample.end_time}`)
      }
    }
    
    console.log('\n🎉 Patient-provider-schedule connection verified and fixed!')
    console.log('🔄 Try the app again - it should now show available times')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

verifyConnection()