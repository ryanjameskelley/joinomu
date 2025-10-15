const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAssignments() {
  try {
    console.log('🔍 Creating manual patient assignments...')
    
    const patientProfileId = 'f80efad2-7d37-49ea-b186-bf5f4bf5acc6'
    
    // Get the patient ID
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
    
    // Create some sample providers in the database
    // First create profiles with proper UUIDs
    const providerProfiles = [
      {
        id: randomUUID(),
        email: 'dr.johnson@sample.com',
        first_name: 'Dr. Sarah',
        last_name: 'Johnson',
        role: 'provider'
      },
      {
        id: randomUUID(), 
        email: 'dr.chen@sample.com',
        first_name: 'Dr. Michael',
        last_name: 'Chen',
        role: 'provider'
      }
    ]
    
    const createdProviders = []
    
    for (const profile of providerProfiles) {
      console.log(`🔄 Creating provider profile: ${profile.first_name} ${profile.last_name}`)
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profile.id)
        .single()
      
      let profileData
      
      if (existingProfile) {
        console.log(`✅ Profile already exists: ${profile.id}`)
        profileData = existingProfile
      } else {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert(profile)
          .select()
          .single()
        
        if (profileError) {
          console.error(`❌ Failed to create profile: ${profileError.message}`)
          continue
        }
        
        profileData = newProfile
        console.log(`✅ Created profile: ${profile.id}`)
      }
      
      // Check if provider record already exists
      const { data: existingProvider } = await supabase
        .from('providers')
        .select('*')
        .eq('profile_id', profile.id)
        .single()
      
      let providerData
      
      if (existingProvider) {
        console.log(`✅ Provider already exists: ${profile.id}`)
        providerData = existingProvider
      } else {
        const { data: newProvider, error: providerError } = await supabase
          .from('providers')
          .insert({
            profile_id: profile.id,
            specialty: profile.first_name.includes('Sarah') ? 'Endocrinology' : 'Family Medicine',
            license_number: `MD${Math.floor(Math.random() * 90000) + 10000}`,
            years_experience: Math.floor(Math.random() * 15) + 5,
            bio: `Experienced healthcare provider specializing in comprehensive patient care.`
          })
          .select()
          .single()
        
        if (providerError) {
          console.error(`❌ Failed to create provider: ${providerError.message}`)
          continue
        }
        
        providerData = newProvider
        console.log(`✅ Created provider: ${profile.id}`)
      }
      
      createdProviders.push({ profile: profileData, provider: providerData })
    }
    
    if (createdProviders.length === 0) {
      console.error('❌ No providers available for assignment')
      return
    }
    
    // Now create patient assignments
    for (let i = 0; i < createdProviders.length; i++) {
      const { provider } = createdProviders[i]
      const treatmentType = i === 0 ? 'general_care' : 'weight_loss'
      const isPrimary = i === 0
      
      console.log(`🔄 Creating assignment: Patient ${patient.id} -> Provider ${provider.id} (${treatmentType})`)
      
      // Check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from('patient_assignments')
        .select('id')
        .eq('patient_id', patient.id)
        .eq('provider_id', provider.id)
        .eq('treatment_type', treatmentType)
        .single()
      
      if (existingAssignment) {
        console.log(`✅ Assignment already exists: ${existingAssignment.id}`)
        continue
      }
      
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
        console.error(`❌ Failed to create assignment: ${assignmentError.message}`)
      } else {
        console.log(`✅ Created assignment: ${assignment.id}`)
      }
    }
    
    // Verify the assignments
    console.log('🔍 Verifying created assignments...')
    const { data: verification, error: verifyError } = await supabase
      .from('patient_assignments')
      .select(`
        id,
        treatment_type,
        is_primary,
        providers(
          id,
          specialty,
          profiles(first_name, last_name)
        )
      `)
      .eq('patient_id', patient.id)
      .eq('active', true)
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError)
    } else {
      console.log('✅ Final verification - Patient assignments:')
      verification.forEach((assignment, index) => {
        const provider = assignment.providers
        const profile = provider.profiles
        console.log(`  ${index + 1}. ${profile.first_name} ${profile.last_name} (${provider.specialty}) - ${assignment.treatment_type} - Primary: ${assignment.is_primary}`)
      })
    }
    
    console.log('🎉 Manual patient assignment creation complete!')
    console.log('🔍 The patient should now see assigned providers in the visits booking dialog.')
    
  } catch (error) {
    console.error('❌ Exception in assignment creation:', error)
  }
}

createAssignments()