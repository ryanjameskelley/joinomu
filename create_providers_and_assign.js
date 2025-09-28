const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createProvidersAndAssign() {
  try {
    console.log('🔍 Creating providers and assigning patient...')
    
    const patientProfileId = 'f80efad2-7d37-49ea-b186-bf5f4bf5acc6'
    
    // Create provider profiles first
    const providers = [
      {
        email: 'dr.johnson@joinomu.com',
        first_name: 'Dr. Sarah',
        last_name: 'Johnson',
        specialty: 'Endocrinology',
        license_number: 'MD12345'
      },
      {
        email: 'dr.chen@joinomu.com',
        first_name: 'Dr. Michael',
        last_name: 'Chen',
        specialty: 'Family Medicine',
        license_number: 'MD54321'
      },
      {
        email: 'dr.rodriguez@joinomu.com',
        first_name: 'Dr. Emily',
        last_name: 'Rodriguez',
        specialty: 'Internal Medicine',
        license_number: 'MD98765'
      }
    ]
    
    const createdProviders = []
    
    for (const providerData of providers) {
      console.log(`🔄 Creating provider: ${providerData.first_name} ${providerData.last_name}`)
      
      // First create a profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: providerData.email,
          first_name: providerData.first_name,
          last_name: providerData.last_name,
          role: 'provider'
        })
        .select()
        .single()
      
      if (profileError) {
        console.error(`❌ Failed to create profile for ${providerData.first_name}:`, profileError)
        continue
      }
      
      console.log(`✅ Created profile for ${providerData.first_name}:`, profileData.id)
      
      // Then create the provider record
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .insert({
          profile_id: profileData.id,
          specialty: providerData.specialty,
          license_number: providerData.license_number,
          years_experience: Math.floor(Math.random() * 20) + 5, // 5-25 years
          bio: `Experienced ${providerData.specialty} specialist providing quality healthcare.`
        })
        .select()
        .single()
      
      if (providerError) {
        console.error(`❌ Failed to create provider for ${providerData.first_name}:`, providerError)
        continue
      }
      
      console.log(`✅ Created provider for ${providerData.first_name}:`, provider.id)
      createdProviders.push({ ...provider, profile: profileData })
    }
    
    if (createdProviders.length === 0) {
      console.error('❌ No providers were created successfully')
      return
    }
    
    console.log(`✅ Created ${createdProviders.length} providers successfully`)
    
    // Now assign the patient to the first provider
    const selectedProvider = createdProviders[0]
    console.log(`🔄 Assigning patient ${patientProfileId} to provider ${selectedProvider.profile.first_name} ${selectedProvider.profile.last_name}`)
    
    const { data: assignmentResult, error: assignmentError } = await supabase.rpc('assign_patient_to_provider', {
      patient_profile_id: patientProfileId,
      provider_profile_id: selectedProvider.profile_id,
      treatment_type_param: 'general_care',
      is_primary_param: true
    })
    
    if (assignmentError) {
      console.error('❌ Assignment failed:', assignmentError)
      return
    }
    
    console.log('✅ Primary assignment result:', assignmentResult)
    
    // Create additional assignments for other providers
    for (let i = 1; i < createdProviders.length; i++) {
      const provider = createdProviders[i]
      const treatmentTypes = ['weight_loss', 'diabetes_management', 'cardiovascular']
      
      console.log(`🔄 Creating secondary assignment to ${provider.profile.first_name} ${provider.profile.last_name}`)
      
      const { data: secondaryResult, error: secondaryError } = await supabase.rpc('assign_patient_to_provider', {
        patient_profile_id: patientProfileId,
        provider_profile_id: provider.profile_id,
        treatment_type_param: treatmentTypes[i - 1],
        is_primary_param: false
      })
      
      if (secondaryError) {
        console.log(`⚠️ Secondary assignment failed: ${secondaryError.message}`)
      } else {
        console.log(`✅ Secondary assignment created for ${provider.profile.first_name} ${provider.profile.last_name}`)
      }
    }
    
    // Verify all assignments
    console.log('🔍 Verifying patient assignments...')
    const { data: verification, error: verifyError } = await supabase
      .from('patient_assignments')
      .select(`
        *,
        patients(first_name, last_name, profile_id),
        providers(
          id,
          profile_id,
          specialty,
          profiles(first_name, last_name, email)
        )
      `)
      .eq('patients.profile_id', patientProfileId)
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError)
      return
    }
    
    console.log('✅ Final verification - Patient assignments:')
    verification.forEach((assignment, index) => {
      const provider = assignment.providers
      const providerProfile = provider.profiles
      console.log(`  ${index + 1}. ${providerProfile.first_name} ${providerProfile.last_name} (${provider.specialty}) - ${assignment.treatment_type} - Primary: ${assignment.is_primary}`)
    })
    
    console.log('🎉 Provider creation and patient assignment complete!')
    
  } catch (error) {
    console.error('❌ Exception in process:', error)
  }
}

createProvidersAndAssign()