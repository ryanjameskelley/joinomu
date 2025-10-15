const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAssignments() {
  try {
    console.log('🚀 Setting up providers and patient assignments...')
    
    // Use existing patient profile (sarah.j@test.com)
    const patientProfileId = '11111111-1111-1111-1111-111111111111'
    
    // Create providers using existing provider profiles
    const providerProfiles = [
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Dr. Emily Watson
      'cccccccc-cccc-cccc-cccc-cccccccccccc'  // Dr. James Wilson
    ]
    
    const createdProviders = []
    
    for (let i = 0; i < providerProfiles.length; i++) {
      const profileId = providerProfiles[i]
      const specialty = i === 0 ? 'Weight Loss' : 'Mens Health'
      const treatmentType = i === 0 ? 'weight_loss' : 'mens_health'
      
      console.log(`👨‍⚕️ Creating ${specialty} provider...`)
      
      const { data: provider, error } = await supabase
        .from('providers')
        .upsert({
          profile_id: profileId,
          specialty: specialty,
          license_number: 'TEST123',
          active: true
        })
        .select()
        .single()
      
      if (error) {
        console.error('❌ Provider error:', error)
        continue
      }
      
      createdProviders.push({ ...provider, treatmentType })
      console.log(`✅ Created ${specialty} provider: ${provider.id}`)
    }
    
    // Get or create patient record
    console.log('🏥 Getting patient record...')
    let { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('profile_id', patientProfileId)
      .single()
    
    if (!patient) {
      console.log('Creating new patient record...')
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          profile_id: patientProfileId,
          date_of_birth: '1990-01-01',
          phone: '555-0123'
        })
        .select()
        .single()
      
      if (patientError) {
        console.error('❌ Patient error:', patientError)
        return
      }
      
      patient = newPatient
    }
    
    console.log('✅ Patient created:', patient.id)
    
    // Create provider schedules
    console.log('📅 Creating provider schedules...')
    
    for (const provider of createdProviders) {
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
          treatment_types: [provider.treatmentType],
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
      .eq('patient_id', patient.id)
    
    for (let i = 0; i < createdProviders.length; i++) {
      const provider = createdProviders[i]
      
      const { error: assignmentError } = await supabase
        .from('patient_assignments')
        .insert({
          patient_id: patient.id,
          provider_id: provider.id,
          treatment_type: provider.treatmentType,
          is_primary: i === 0,
          assigned_date: new Date().toISOString(),
          active: true
        })
      
      if (assignmentError) {
        console.error(`❌ Assignment error:`, assignmentError)
        continue
      }
      
      console.log(`✅ Assigned ${provider.specialty} provider (${provider.treatmentType})`)
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
    console.log(`   Providers: ${createdProviders.length} (Weight Loss & Mens Health)`)
    console.log(`   Provider schedules: ${createdProviders.length * 15} (15 per provider)`)
    console.log(`   Patient assignments: ${createdProviders.length}`)
    console.log('')
    console.log('🔐 Login as sarah.j@test.com / password123 to test!')
    console.log('🚀 The visits dialog should now work with real provider schedules!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupAssignments()