const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createFinalAssignment() {
  try {
    console.log('🔍 Creating final patient assignment...')
    
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
    
    // Check what columns exist in providers table
    const { data: sampleProvider, error: sampleError } = await supabase
      .from('providers')
      .select('*')
      .limit(1)
    
    console.log('🔍 Providers table sample:', sampleProvider)
    console.log('🔍 Providers table error:', sampleError)
    
    // Create minimal providers
    const mockProviders = [
      {
        profile_id: randomUUID(),
        specialty: 'Endocrinology',
        license_number: 'MD12345'
      },
      {
        profile_id: randomUUID(),
        specialty: 'Family Medicine', 
        license_number: 'MD54321'
      }
    ]
    
    const createdProviders = []
    
    for (const provider of mockProviders) {
      console.log(`🔄 Creating minimal provider: ${provider.specialty}`)
      
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .insert(provider)
        .select()
        .single()
      
      if (providerError) {
        console.error(`❌ Failed to create provider: ${providerError.message}`)
        console.error('❌ Full error:', providerError)
        continue
      }
      
      console.log(`✅ Created provider: ${providerData.id}`)
      createdProviders.push(providerData)
    }
    
    if (createdProviders.length === 0) {
      console.error('❌ No providers were created')
      console.log('🔍 Let me try to use existing providers if any exist...')
      
      const { data: existingProviders, error: existingError } = await supabase
        .from('providers')
        .select('*')
        .limit(2)
      
      if (existingError) {
        console.error('❌ Failed to get existing providers:', existingError)
        return
      }
      
      if (existingProviders && existingProviders.length > 0) {
        console.log('✅ Found existing providers:', existingProviders)
        createdProviders.push(...existingProviders)
      } else {
        console.error('❌ No existing providers found either')
        return
      }
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
        console.error('❌ Full assignment error:', assignmentError)
      } else {
        console.log(`✅ Created assignment: ${assignment.id}`)
      }
    }
    
    console.log('🎉 Assignment process complete!')
    
  } catch (error) {
    console.error('❌ Exception:', error)
  }
}

createFinalAssignment()