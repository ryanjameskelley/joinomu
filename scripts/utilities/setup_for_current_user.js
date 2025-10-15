const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupForCurrentUser() {
  try {
    console.log('🚀 Setting up providers and assignments for current user...')
    
    // First, check what profiles exist
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role')
    
    if (profilesError) {
      console.error('❌ Error getting profiles:', profilesError)
      return
    }
    
    console.log('👥 Found profiles:')
    profiles.forEach(profile => {
      console.log(`   ${profile.email} (${profile.role}) - ID: ${profile.id}`)
    })
    
    // Look for our specific patient profile ID first, then fall back
    const targetPatientId = 'f80efad2-7d37-49ea-b186-bf5f4bf5acc6'
    let patientProfile = profiles.find(p => p.id === targetPatientId)
    
    if (!patientProfile) {
      // Fall back to any patient profile
      patientProfile = profiles.find(p => p.role === 'patient')
    }
    
    if (!patientProfile) {
      console.error('❌ No patient profile found')
      return
    }
    
    console.log(`👤 Using patient profile: ${patientProfile.email} (${patientProfile.id})`)
    
    // Get or create patient record
    let { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('profile_id', patientProfile.id)
      .single()
    
    if (!patient) {
      console.log('🏥 Creating patient record...')
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          profile_id: patientProfile.id,
          date_of_birth: '1990-01-01',
          phone: '555-0123'
        })
        .select()
        .single()
      
      if (patientError) {
        console.error('❌ Patient creation error:', patientError)
        return
      }
      
      patient = newPatient
    }
    
    console.log(`✅ Patient record: ${patient.id}`)
    
    // Create provider profiles and records
    const providerConfigs = [
      {
        profileId: 'a1b2c3d4-e5f6-7890-1234-567890123456',
        email: 'weightloss@provider.com',
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        specialty: 'Weight Loss',
        treatmentType: 'weight_loss'
      },
      {
        profileId: 'b2c3d4e5-f6a7-8901-2345-678901234567',
        email: 'menshealth@provider.com',
        firstName: 'Dr. Michael',
        lastName: 'Chen',
        specialty: 'Mens Health',
        treatmentType: 'mens_health'
      }
    ]
    
    const createdProviders = []
    
    for (const config of providerConfigs) {
      console.log(`👨‍⚕️ Creating ${config.specialty} provider...`)
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: config.profileId,
          email: config.email,
          first_name: config.firstName,
          last_name: config.lastName,
          role: 'provider'
        }, { onConflict: 'id' })
      
      if (profileError && profileError.code !== '23505') {
        console.error(`❌ Profile error:`, profileError)
        continue
      }
      
      // Create provider record
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .upsert({
          profile_id: config.profileId,
          specialty: config.specialty,
          license_number: 'TEST123',
          active: true
        }, { onConflict: 'profile_id' })
        .select()
        .single()
      
      if (providerError) {
        console.error(`❌ Provider error:`, providerError)
        continue
      }
      
      createdProviders.push({ ...provider, treatmentType: config.treatmentType })
      console.log(`✅ ${config.specialty} provider: ${provider.id}`)
    }
    
    if (createdProviders.length === 0) {
      console.error('❌ No providers created')
      return
    }
    
    // Create provider schedules
    console.log('📅 Creating provider schedules...')
    
    // Clear existing schedules
    await supabase.from('provider_schedules').delete().in('provider_id', createdProviders.map(p => p.id))
    
    for (const provider of createdProviders) {
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
    await supabase.from('patient_assignments').delete().eq('patient_id', patient.id)
    
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
    console.log(`📋 Patient ${patientProfile.email} assigned to ${createdProviders.length} providers`)
    console.log('🚀 Ready to test visits booking!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupForCurrentUser()