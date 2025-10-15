const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function completeSetup() {
  try {
    console.log('🚀 Setting up complete appointment system...')
    
    const patientProfileId = 'f80efad2-7d37-49ea-b186-bf5f4bf5acc6'
    
    // Step 1: Create auth user for patient (needed for RLS)
    console.log('👤 Creating auth user for patient...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'patient@test.com',
      password: 'password123',
      user_metadata: {
        role: 'patient',
        first_name: 'Test',
        last_name: 'Patient'
      },
      email_confirm: true,
      user_id: patientProfileId // Use specific UUID
    })
    
    if (authError && !authError.message.includes('already registered') && authError.code !== 'email_exists') {
      console.error('❌ Auth user error:', authError)
      return
    }
    
    console.log('✅ Auth user ready')
    
    // Step 2: Create patient profile
    console.log('📝 Creating/updating patient profile...')
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: patientProfileId,
      email: 'patient@test.com',
      first_name: 'Test',
      last_name: 'Patient',
      role: 'patient'
    }, { onConflict: 'id' })
    
    if (profileError && profileError.code !== '23505') {
      console.error('❌ Profile error:', profileError)
      return
    }
    console.log('✅ Patient profile ready')
    
    // Step 3: Create patient record
    console.log('🏥 Creating patient record...')
    const { data: patient, error: patientError } = await supabase.from('patients').upsert({
      profile_id: patientProfileId,
      date_of_birth: '1990-01-01',
      phone: '555-0123'
    }).select().single()
    
    if (patientError) {
      console.error('❌ Patient record error:', patientError)
      return
    }
    
    console.log('✅ Patient created:', patient.id)
    
    // Step 4: Create providers with auth users
    const providerConfigs = [
      {
        profileId: 'provider-weightloss-id',
        email: 'weightloss@test.com',
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        specialty: 'Weight Loss',
        treatmentType: 'weight_loss'
      },
      {
        profileId: 'provider-menshealth-id', 
        email: 'menshealth@test.com',
        firstName: 'Dr. Michael',
        lastName: 'Chen',
        specialty: 'Mens Health',
        treatmentType: 'mens_health'
      }
    ]
    
    const createdProviders = []
    
    for (const config of providerConfigs) {
      console.log(`👨‍⚕️ Creating ${config.specialty} provider...`)
      
      // Create auth user
      const { error: providerAuthError } = await supabase.auth.admin.createUser({
        email: config.email,
        password: 'password123',
        user_metadata: {
          role: 'provider',
          first_name: config.firstName,
          last_name: config.lastName
        },
        email_confirm: true,
        user_id: config.profileId
      })
      
      if (providerAuthError && !providerAuthError.message.includes('already registered') && providerAuthError.code !== 'email_exists') {
        console.error(`❌ Provider auth error:`, providerAuthError)
        continue
      }
      
      // Create profile
      await supabase.from('profiles').upsert({
        id: config.profileId,
        email: config.email,
        first_name: config.firstName,
        last_name: config.lastName,
        role: 'provider'
      }, { onConflict: 'id' })
      
      // Create provider record
      const { data: provider, error: providerError } = await supabase.from('providers').upsert({
        profile_id: config.profileId,
        specialty: config.specialty,
        license_number: 'TEST123',
        active: true
      }).select().single()
      
      if (providerError) {
        console.error(`❌ Provider record error:`, providerError)
        continue
      }
      
      createdProviders.push({ ...provider, treatmentType: config.treatmentType })
      console.log(`✅ Created ${config.specialty} provider: ${provider.id}`)
    }
    
    // Step 5: Create provider schedules
    console.log('📅 Creating provider schedules...')
    
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
    
    // Step 6: Create patient assignments
    console.log('🔗 Creating patient assignments...')
    
    for (let i = 0; i < createdProviders.length; i++) {
      const provider = createdProviders[i]
      
      const { error: assignmentError } = await supabase.from('patient_assignments').insert({
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
      
      console.log(`✅ Assigned patient to ${provider.specialty} provider (${provider.treatmentType})`)
    }
    
    // Step 7: Verification
    console.log('🧪 Verifying setup...')
    
    const { data: assignments, error: verifyError } = await supabase
      .from('patient_assignments')
      .select(`
        id,
        treatment_type,
        is_primary,
        providers(id, specialty),
        patients(id, profile_id)
      `)
      .eq('patient_id', patient.id)
      .eq('active', true)
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError)
    } else {
      console.log('✅ Verification successful!')
      assignments.forEach((assignment, index) => {
        console.log(`   ${index + 1}. ${assignment.providers.specialty} - ${assignment.treatment_type} (Primary: ${assignment.is_primary})`)
      })
    }
    
    console.log('')
    console.log('🎉 Complete setup finished!')
    console.log('📋 Summary:')
    console.log(`   Patient: ${patient.id} (Profile: ${patientProfileId})`)
    console.log(`   Providers: ${createdProviders.length}`)
    console.log(`   Provider schedules: ${createdProviders.length * 15}`)
    console.log(`   Patient assignments: ${createdProviders.length}`)
    console.log('')
    console.log('🔐 Login credentials:')
    console.log('   Patient: patient@test.com / password123')
    console.log('')
    console.log('🚀 Ready to test visits booking!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

completeSetup()