const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAssignments() {
  try {
    console.log('🚀 Creating provider schedules and patient assignments...')
    
    // Get existing providers
    const { data: providers } = await supabase
      .from('providers')
      .select('id, specialty')
    
    console.log('Found providers:', providers)
    
    // Get patient (sarah.j@test.com)
    const patientId = 'a0e04389-5ad4-4d1d-8454-46ec1897b37a'
    
    // Create provider schedules
    console.log('📅 Creating provider schedules...')
    
    for (const provider of providers) {
      const treatmentType = provider.specialty === 'Weight Loss' ? 'weight_loss' : 'mens_health'
      
      // Clear existing schedules
      await supabase
        .from('provider_schedules')
        .delete()
        .eq('provider_id', provider.id)
      
      // Monday-Friday, 3 time blocks each day
      const schedules = []
      for (let day = 1; day <= 5; day++) {
        schedules.push(
          { day_of_week: day, start_time: '08:00:00', end_time: '12:00:00' },
          { day_of_week: day, start_time: '13:00:00', end_time: '17:00:00' },
          { day_of_week: day, start_time: '18:00:00', end_time: '20:00:00' }
        )
      }
      
      for (const schedule of schedules) {
        await supabase.from('provider_schedules').insert({
          provider_id: provider.id,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          slot_duration_minutes: 30,
          treatment_types: [treatmentType],
          active: true
        })
      }
      
      console.log(`✅ Created ${schedules.length} schedule blocks for ${provider.specialty}`)
    }
    
    // Create patient assignments
    console.log('🔗 Creating patient assignments...')
    
    // Clear existing assignments
    await supabase
      .from('patient_assignments')
      .delete()
      .eq('patient_id', patientId)
    
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i]
      const treatmentType = provider.specialty === 'Weight Loss' ? 'weight_loss' : 'mens_health'
      
      const { error: assignmentError } = await supabase
        .from('patient_assignments')
        .insert({
          patient_id: patientId,
          provider_id: provider.id,
          treatment_type: treatmentType,
          is_primary: i === 0,
          assigned_date: new Date().toISOString(),
          active: true
        })
      
      if (assignmentError) {
        console.error(`❌ Assignment error:`, assignmentError)
        continue
      }
      
      console.log(`✅ Assigned ${provider.specialty} provider (${treatmentType})`)
    }
    
    // Verification
    console.log('🧪 Verifying setup...')
    
    const { data: assignments } = await supabase
      .from('patient_assignments')
      .select(`
        id,
        treatment_type,
        is_primary,
        providers(id, specialty)
      `)
      .eq('patient_id', patientId)
      .eq('active', true)
    
    console.log('✅ Final verification:')
    assignments?.forEach((assignment, index) => {
      console.log(`   ${index + 1}. ${assignment.providers.specialty} - ${assignment.treatment_type} (Primary: ${assignment.is_primary})`)
    })
    
    console.log('')
    console.log('🎉 Assignments complete!')
    console.log('📋 Summary:')
    console.log(`   Patient: sarah.j@test.com`)
    console.log(`   Provider assignments: ${assignments?.length}`)
    console.log(`   Provider schedules: ${providers.length * 15} (15 per provider)`)
    console.log('')
    console.log('🔐 Login as sarah.j@test.com / password123 to test!')
    console.log('🚀 The visits dialog should now work with real provider schedules!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

createAssignments()