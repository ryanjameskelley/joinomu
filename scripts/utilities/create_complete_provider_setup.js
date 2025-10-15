const { createClient } = require('@supabase/supabase-js')

// Use the admin key for more permissions
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createCompleteSetup() {
  try {
    console.log('🔍 Creating complete provider setup with auth users...')
    
    const patientProfileId = 'f80efad2-7d37-49ea-b186-bf5f4bf5acc6'
    
    // First, get the patient
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
    
    // Create provider users in auth.users and profiles
    const providers = [
      {
        email: 'dr.johnson@joinomu.local',
        password: 'password123',
        first_name: 'Dr. Sarah',
        last_name: 'Johnson',
        specialty: 'Endocrinology',
        license_number: 'MD12345'
      },
      {
        email: 'dr.chen@joinomu.local', 
        password: 'password123',
        first_name: 'Dr. Michael',
        last_name: 'Chen',
        specialty: 'Family Medicine',
        license_number: 'MD54321'
      }
    ]
    
    const createdProviders = []
    
    for (const providerData of providers) {
      console.log(`🔄 Creating provider: ${providerData.first_name} ${providerData.last_name}`)
      
      try {
        // Create auth user
        console.log('  📧 Creating auth user...')
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: providerData.email,
          password: providerData.password,
          user_metadata: {
            role: 'provider',
            first_name: providerData.first_name,
            last_name: providerData.last_name
          },
          email_confirm: true
        })
        
        if (authError) {
          console.error(`  ❌ Failed to create auth user: ${authError.message}`)
          continue
        }
        
        console.log(`  ✅ Created auth user: ${authUser.user.id}`)
        
        // Create profile
        console.log('  👤 Creating profile...')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.user.id,
            email: providerData.email,
            first_name: providerData.first_name,
            last_name: providerData.last_name,
            role: 'provider'
          })
          .select()
          .single()
        
        if (profileError) {
          console.error(`  ❌ Failed to create profile: ${profileError.message}`)
          continue
        }
        
        console.log(`  ✅ Created profile: ${profile.id}`)
        
        // Create provider
        console.log('  🏥 Creating provider record...')
        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .insert({
            profile_id: profile.id,
            specialty: providerData.specialty,
            license_number: providerData.license_number,
            years_experience: Math.floor(Math.random() * 15) + 5,
            active: true
          })
          .select()
          .single()
        
        if (providerError) {
          console.error(`  ❌ Failed to create provider: ${providerError.message}`)
          continue
        }
        
        console.log(`  ✅ Created provider: ${provider.id}`)
        
        createdProviders.push({
          auth: authUser.user,
          profile: profile,
          provider: provider
        })
        
      } catch (error) {
        console.error(`❌ Exception creating ${providerData.first_name}:`, error)
        continue
      }
    }
    
    if (createdProviders.length === 0) {
      console.error('❌ No providers were created successfully')
      return
    }
    
    console.log(`✅ Successfully created ${createdProviders.length} providers`)
    
    // Now create patient assignments
    console.log('🔄 Creating patient assignments...')
    
    for (let i = 0; i < createdProviders.length; i++) {
      const { provider } = createdProviders[i]
      const treatmentTypes = ['general_care', 'weight_loss', 'diabetes_management']
      const treatmentType = treatmentTypes[i % treatmentTypes.length]
      const isPrimary = i === 0
      
      console.log(`  🔗 Assigning patient to ${provider.specialty} provider (${treatmentType})`)
      
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
    
    // Final verification
    console.log('🔍 Final verification...')
    
    const { data: verification, error: verifyError } = await supabase
      .from('patient_assignments')
      .select(`
        id,
        treatment_type,
        is_primary,
        active,
        providers(
          id,
          profile_id,
          specialty,
          license_number,
          profiles(first_name, last_name, email)
        )
      `)
      .eq('patient_id', patient.id)
      .eq('active', true)
    
    if (verifyError) {
      console.error('❌ Verification query failed:', verifyError)
    } else {
      console.log('✅ Final verification - Patient assignments:')
      verification.forEach((assignment, index) => {
        const provider = assignment.providers
        const profile = provider.profiles
        console.log(`  ${index + 1}. ${profile.first_name} ${profile.last_name} (${provider.specialty})`)
        console.log(`     Treatment: ${assignment.treatment_type}`)
        console.log(`     Primary: ${assignment.is_primary}`)
        console.log(`     Assignment ID: ${assignment.id}`)
      })
    }
    
    // Test the auth service function
    console.log('🧪 Testing authService.getPatientAssignedProviders...')
    
    // We can't import the auth service here, so let's simulate the query
    const { data: testResult, error: testError } = await supabase
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
    
    if (testError) {
      console.error('❌ Test query failed:', testError)
    } else {
      console.log('✅ Test query successful!')
      console.log('   Assignments found:', testResult.length)
      testResult.forEach((assignment) => {
        console.log(`   - ${assignment.providers.specialty} (ID: ${assignment.providers.id})`)
      })
    }
    
    console.log('🎉 Complete provider setup finished!')
    console.log('')
    console.log('📋 Summary:')
    console.log(`   Patient ID: ${patient.id}`)
    console.log(`   Provider assignments: ${createdProviders.length}`)
    console.log('   Ready for visits booking dialog testing!')
    
  } catch (error) {
    console.error('❌ Top-level exception:', error)
  }
}

createCompleteSetup()