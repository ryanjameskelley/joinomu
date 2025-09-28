const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function useExistingProviders() {
  try {
    console.log('🔍 Using existing providers to create assignments...')
    
    const patientProfileId = 'f80efad2-7d37-49ea-b186-bf5f4bf5acc6'
    
    // Get the patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('profile_id', patientProfileId)
      .single()
    
    if (patientError || !patient) {
      console.error('❌ Patient not found:', patientError)
      return
    }
    
    console.log('✅ Found patient:', patient.id)
    
    // Check existing profiles that could be providers
    console.log('🔍 Checking existing profiles...')
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', patientProfileId) // Exclude the patient
    
    if (profilesError) {
      console.error('❌ Error getting profiles:', profilesError)
      return
    }
    
    console.log('✅ Found profiles:', existingProfiles.length)
    existingProfiles.forEach(profile => {
      console.log(`  - ${profile.first_name} ${profile.last_name} (${profile.email}) - Role: ${profile.role}`)
    })
    
    // Create providers for profiles that don't have provider records yet
    const providersToCreate = existingProfiles
      .filter(profile => profile.role !== 'patient') // Skip patient profiles
      .slice(0, 2) // Take first 2 for testing
    
    if (providersToCreate.length === 0) {
      console.log('⚠️ No suitable profiles found for providers')
      
      // Let's create some basic profiles first
      const { data: newProfile1, error: profile1Error } = await supabase
        .from('profiles')
        .insert({
          id: '6ca72052-fec6-4e04-af2d-0de525390c32', // Use one of the created auth user IDs
          email: 'dr.johnson@joinomu.local',
          first_name: 'Dr. Sarah',
          last_name: 'Johnson',
          role: 'provider'
        })
        .select()
        .single()
        .catch(() => null) // Ignore if already exists
      
      if (newProfile1) {
        console.log('✅ Created profile for Dr. Johnson')
        providersToCreate.push(newProfile1)
      }
      
      const { data: newProfile2, error: profile2Error } = await supabase
        .from('profiles')
        .insert({
          id: '2959448e-8381-47b7-9988-d5aa3ddffc5b', // Use the other created auth user ID
          email: 'dr.chen@joinomu.local',
          first_name: 'Dr. Michael',
          last_name: 'Chen',
          role: 'provider'
        })
        .select()
        .single()
        .catch(() => null) // Ignore if already exists
        
      if (newProfile2) {
        console.log('✅ Created profile for Dr. Chen')
        providersToCreate.push(newProfile2)
      }
    }
    
    const createdProviders = []
    
    for (let i = 0; i < providersToCreate.length; i++) {
      const profile = providersToCreate[i]
      const specialties = ['Endocrinology', 'Family Medicine', 'Internal Medicine']
      const specialty = specialties[i % specialties.length]
      
      console.log(`🔄 Creating/checking provider for ${profile.first_name} ${profile.last_name}`)
      
      // Check if provider already exists
      const { data: existingProvider, error: existingError } = await supabase
        .from('providers')
        .select('*')
        .eq('profile_id', profile.id)
        .single()
      
      let provider
      
      if (existingProvider) {
        console.log(`  ✅ Provider already exists: ${existingProvider.id}`)
        provider = existingProvider
      } else {
        // Create new provider
        const { data: newProvider, error: providerError } = await supabase
          .from('providers')
          .insert({
            profile_id: profile.id,
            specialty: specialty,
            license_number: `MD${Math.floor(Math.random() * 90000) + 10000}`,
            years_experience: Math.floor(Math.random() * 15) + 5,
            active: true
          })
          .select()
          .single()
        
        if (providerError) {
          console.error(`  ❌ Failed to create provider: ${providerError.message}`)
          continue
        }
        
        console.log(`  ✅ Created provider: ${newProvider.id}`)
        provider = newProvider
      }
      
      createdProviders.push({ profile, provider })
    }
    
    if (createdProviders.length === 0) {
      console.error('❌ No providers available for assignment')
      return
    }
    
    console.log(`✅ Have ${createdProviders.length} providers ready for assignment`)
    
    // Clear any existing assignments for this patient
    console.log('🧹 Clearing existing assignments...')
    await supabase
      .from('patient_assignments')
      .delete()
      .eq('patient_id', patient.id)
    
    // Create patient assignments
    console.log('🔄 Creating patient assignments...')
    
    for (let i = 0; i < createdProviders.length; i++) {
      const { profile, provider } = createdProviders[i]
      const treatmentTypes = ['general_care', 'weight_loss', 'diabetes_management']
      const treatmentType = treatmentTypes[i % treatmentTypes.length]
      const isPrimary = i === 0
      
      console.log(`  🔗 Assigning ${profile.first_name} ${profile.last_name} (${provider.specialty}) - ${treatmentType}`)
      
      const { data: assignment, error: assignmentError } = await supabase
        .from('patient_assignments')
        .insert({
          patient_id: patient.id,
          provider_id: provider.id,
          treatment_type: treatmentType,
          is_primary: isPrimary,
          assigned_date: new Date().toISOString(),
          active: true
        })
        .select()
        .single()
      
      if (assignmentError) {
        console.error(`  ❌ Failed to create assignment: ${assignmentError.message}`)
      } else {
        console.log(`  ✅ Created assignment: ${assignment.id}`)
      }
    }
    
    // Final verification with the actual query the app will use
    console.log('🧪 Testing the actual authService query...')
    
    const { data: verification, error: verifyError } = await supabase
      .from('patient_assignments')
      .select(`
        id,
        treatment_type,
        is_primary,
        providers(
          id,
          profile_id,
          specialty,
          license_number
        )
      `)
      .eq('patient_id', patient.id)
      .eq('active', true)
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError)
    } else {
      console.log('✅ Verification successful!')
      console.log(`   Found ${verification.length} assignments:`)
      verification.forEach((assignment, index) => {
        const provider = assignment.providers
        console.log(`   ${index + 1}. ${provider.specialty} (ID: ${provider.id})`)
        console.log(`      Treatment: ${assignment.treatment_type}`)
        console.log(`      Primary: ${assignment.is_primary}`)
      })
      
      // Test the transformation that happens in authService
      console.log('')
      console.log('🔄 Testing data transformation...')
      const transformedProviders = verification.map((assignment, index) => ({
        id: assignment.providers.id,
        name: `${assignment.providers.specialty} Provider ${index + 1}`,
        specialty: assignment.providers.specialty,
        profile_id: assignment.providers.profile_id,
        treatment_type: assignment.treatment_type,
        is_primary: assignment.is_primary
      }))
      
      console.log('✅ Transformed providers:')
      transformedProviders.forEach((provider, index) => {
        console.log(`   ${index + 1}. ${provider.name}`)
        console.log(`      ID: ${provider.id}`)
        console.log(`      Specialty: ${provider.specialty}`)
        console.log(`      Treatment: ${provider.treatment_type}`)
      })
    }
    
    console.log('')
    console.log('🎉 Provider assignment setup complete!')
    console.log('📱 Now test the visits booking dialog - it should show real assigned providers!')
    
  } catch (error) {
    console.error('❌ Exception:', error)
  }
}

useExistingProviders()