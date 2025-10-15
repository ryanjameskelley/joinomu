const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function finalSetup() {
  try {
    console.log('🚀 Final setup using existing providers...')
    
    // Find existing providers
    const { data: existingProviders, error: providersError } = await supabase
      .from('providers')
      .select('id, specialty, profile_id')
    
    if (providersError) {
      console.error('❌ Error getting providers:', providersError)
      return
    }
    
    console.log(`👨‍⚕️ Found ${existingProviders.length} existing providers:`)
    existingProviders.forEach(provider => {
      console.log(`   ${provider.specialty} - ID: ${provider.id}`)
    })
    
    if (existingProviders.length < 2) {
      console.error('❌ Need at least 2 providers for Weight Loss and Mens Health')
      return
    }
    
    // Update provider specialties to Weight Loss and Mens Health
    const providerUpdates = [
      { id: existingProviders[0].id, specialty: 'Weight Loss', treatmentType: 'weight_loss' },
      { id: existingProviders[1].id, specialty: 'Mens Health', treatmentType: 'mens_health' }
    ]
    
    console.log('🔄 Updating provider specialties...')
    for (const update of providerUpdates) {
      await supabase
        .from('providers')
        .update({ specialty: update.specialty })
        .eq('id', update.id)
      
      console.log(`✅ Updated provider to ${update.specialty}`)
    }
    
    // Find patient (sarah.j@test.com)
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, profile_id')
      .eq('profile_id', '11111111-1111-1111-1111-111111111111')
      .single()
    
    if (patientError || !patient) {
      console.error('❌ Patient not found:', patientError)
      return
    }
    
    console.log(`👤 Using patient: ${patient.id}`)
    
    // Create provider schedules
    console.log('📅 Creating provider schedules...')
    
    // Clear existing schedules
    await supabase.from('provider_schedules').delete().in('provider_id', providerUpdates.map(p => p.id))
    
    for (const providerUpdate of providerUpdates) {
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
          provider_id: providerUpdate.id,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          slot_duration_minutes: 30,
          treatment_types: [providerUpdate.treatmentType],
          active: true
        })
      }
      
      console.log(`✅ Created ${schedules.length} schedule blocks for ${providerUpdate.specialty}`)
    }
    
    // Create patient assignments
    console.log('🔗 Creating patient assignments...')
    
    // Clear existing assignments
    await supabase.from('patient_assignments').delete().eq('patient_id', patient.id)
    
    for (let i = 0; i < providerUpdates.length; i++) {
      const providerUpdate = providerUpdates[i]
      
      const { error: assignmentError } = await supabase
        .from('patient_assignments')
        .insert({
          patient_id: patient.id,
          provider_id: providerUpdate.id,
          treatment_type: providerUpdate.treatmentType,
          is_primary: i === 0,
          assigned_date: new Date().toISOString(),
          active: true
        })
      
      if (assignmentError) {
        console.error(`❌ Assignment error:`, assignmentError)
        continue
      }
      
      console.log(`✅ Assigned ${providerUpdate.specialty} provider (${providerUpdate.treatmentType})`)
    }
    
    // Final verification
    console.log('🧪 Verifying setup...')
    
    const { data: assignments } = await supabase
      .from('patient_assignments')
      .select(`
        id,
        treatment_type,
        is_primary,
        providers(id, specialty)
      `)
      .eq('patient_id', patient.id)
      .eq('active', true)
    
    console.log('✅ Final verification:')
    assignments?.forEach((assignment, index) => {
      console.log(`   ${index + 1}. ${assignment.providers.specialty} - ${assignment.treatment_type} (Primary: ${assignment.is_primary})`)
    })
    
    console.log('')
    console.log('🎉 Setup complete!')
    console.log('📋 Summary:')
    console.log(`   Patient: sarah.j@test.com`)
    console.log(`   Providers: Weight Loss & Mens Health`)
    console.log(`   Provider schedules: ${providerUpdates.length * 15} (15 per provider)`)
    console.log(`   Patient assignments: ${providerUpdates.length}`)
    console.log('')
    console.log('🔐 Login as sarah.j@test.com / password123 to test!')
    console.log('🚀 The visits dialog should now work with real provider schedules!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

finalSetup()