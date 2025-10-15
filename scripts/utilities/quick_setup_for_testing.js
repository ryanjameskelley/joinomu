const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function quickSetup() {
  console.log('🚀 Quick setup for testing appointments...')
  
  const patientProfileId = 'f80efad2-7d37-49ea-b186-bf5f4bf5acc6'
  
  // 1. Create patient profile if it doesn't exist
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', patientProfileId)
    .single()
  
  if (!existingProfile) {
    console.log('📝 Creating patient profile...')
    await supabase.from('profiles').insert({
      id: patientProfileId,
      email: 'patient@test.com',
      first_name: 'Test',
      last_name: 'Patient',
      role: 'patient'
    })
  }
  
  // 2. Create patient record
  let { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('profile_id', patientProfileId)
    .single()
  
  if (!patient) {
    console.log('🏥 Creating patient record...')
    const { data: newPatient } = await supabase.from('patients').insert({
      profile_id: patientProfileId,
      date_of_birth: '1990-01-01',
      phone: '555-0123'
    }).select().single()
    patient = newPatient
  }
  
  console.log('✅ Patient ready:', patient.id)
  
  // 3. Create provider profiles and records
  const providers = [
    {
      profile_id: 'weight-loss-provider-id',
      email: 'weightloss@test.com',
      first_name: 'Dr. Weight',
      last_name: 'Loss',
      specialty: 'Weight Loss',
      treatment_types: ['weight_loss']
    },
    {
      profile_id: 'mens-health-provider-id',
      email: 'menshealth@test.com',
      first_name: 'Dr. Mens',
      last_name: 'Health',
      specialty: 'Mens Health',
      treatment_types: ['mens_health']
    }
  ]
  
  const createdProviders = []
  
  for (const providerData of providers) {
    // Create profile
    await supabase.from('profiles').upsert({
      id: providerData.profile_id,
      email: providerData.email,
      first_name: providerData.first_name,
      last_name: providerData.last_name,
      role: 'provider'
    })
    
    // Create provider
    const { data: provider } = await supabase.from('providers').upsert({
      profile_id: providerData.profile_id,
      specialty: providerData.specialty,
      license_number: 'TEST123',
      active: true
    }).select().single()
    
    createdProviders.push({ ...provider, treatment_types: providerData.treatment_types })
    console.log(`✅ Created ${providerData.specialty} provider:`, provider.id)
  }
  
  // 4. Create provider schedules for both providers
  console.log('📅 Creating provider schedules...')
  
  for (const provider of createdProviders) {
    const schedules = []
    
    // Monday-Friday, 3 time blocks each day
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
        treatment_types: provider.treatment_types,
        active: true
      })
    }
    
    console.log(`✅ Created ${schedules.length} schedule blocks for ${provider.specialty}`)
  }
  
  // 5. Create patient assignments
  console.log('🔗 Creating patient assignments...')
  
  for (let i = 0; i < createdProviders.length; i++) {
    const provider = createdProviders[i]
    const treatmentType = provider.treatment_types[0]
    
    await supabase.from('patient_assignments').insert({
      patient_id: patient.id,
      provider_id: provider.id,
      treatment_type: treatmentType,
      is_primary: i === 0,
      assigned_date: new Date().toISOString(),
      active: true
    })
    
    console.log(`✅ Assigned ${provider.specialty} provider (${treatmentType})`)
  }
  
  console.log('')
  console.log('🎉 Quick setup complete!')
  console.log('📋 Summary:')
  console.log(`   Patient: ${patient.id}`)
  console.log(`   Providers: ${createdProviders.length}`)
  console.log(`   Provider schedules: ${createdProviders.length * 15} (15 per provider)`)
  console.log(`   Patient assignments: ${createdProviders.length}`)
  console.log('')
  console.log('🧪 Test the appointments flow now!')
}

quickSetup().catch(console.error)