const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSimpleAssignment() {
  try {
    console.log('🔍 Creating simple patient assignments with mock data...')
    
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
    
    // Create mock providers directly in providers table
    const mockProviders = [
      {
        id: randomUUID(),
        profile_id: randomUUID(), // This won't exist in profiles but we'll handle that
        specialty: 'Endocrinology',
        license_number: 'MD12345',
        years_experience: 10,
        bio: 'Experienced endocrinologist',
        active: true
      },
      {
        id: randomUUID(),
        profile_id: randomUUID(),
        specialty: 'Family Medicine', 
        license_number: 'MD54321',
        years_experience: 15,
        bio: 'Family medicine specialist',
        active: true
      }
    ]
    
    const createdProviders = []
    
    for (const provider of mockProviders) {
      console.log(`🔄 Creating mock provider: ${provider.specialty}`)
      
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .insert(provider)
        .select()
        .single()
      
      if (providerError) {
        console.error(`❌ Failed to create provider: ${providerError.message}`)
        continue
      }
      
      console.log(`✅ Created provider: ${providerData.id}`)
      createdProviders.push(providerData)
    }
    
    if (createdProviders.length === 0) {
      console.error('❌ No providers were created')
      return
    }
    
    // Now create patient assignments
    for (let i = 0; i < createdProviders.length; i++) {
      const provider = createdProviders[i]
      const treatmentType = i === 0 ? 'general_care' : 'weight_loss'
      const isPrimary = i === 0
      
      console.log(`🔄 Creating assignment: Patient ${patient.id} -> Provider ${provider.id} (${treatmentType})`)
      
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
    
    // Test the authService function
    console.log('🔍 Testing the getPatientAssignedProviders function...')
    
    // Manual test of the query we use in the authService
    const { data: testQuery, error: testError } = await supabase
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
      console.log('✅ Test query succeeded:')
      console.log('Raw data:', JSON.stringify(testQuery, null, 2))
      
      // The issue might be that we don't have profiles for these providers
      // Let's modify the authService to work without the profiles join
    }
    
    console.log('🎉 Simple assignment creation complete!')
    
  } catch (error) {
    console.error('❌ Exception:', error)
  }
}

createSimpleAssignment()