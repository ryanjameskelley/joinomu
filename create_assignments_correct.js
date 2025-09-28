const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createCorrectAssignments() {
  try {
    console.log('🔍 Creating patient assignments with correct schema...')
    
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
    
    // Get existing providers
    const { data: existingProviders, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('active', true)
      .limit(2)
    
    if (providerError) {
      console.error('❌ Provider error:', providerError)
      return
    }
    
    console.log('✅ Found existing providers:', existingProviders.length)
    existingProviders.forEach((provider, i) => {
      console.log(`  ${i + 1}. ${provider.specialty} (ID: ${provider.id})`)
    })
    
    if (existingProviders.length === 0) {
      console.log('⚠️ No existing providers found. Creating new ones with correct schema...')
      
      // Create providers with only the columns that exist
      const newProviders = [
        {
          profile_id: '6ca72052-fec6-4e04-af2d-0de525390c32', // From existing profiles
          specialty: 'Endocrinology',
          license_number: 'MD12345',
          active: true
        },
        {
          profile_id: '2959448e-8381-47b7-9988-d5aa3ddffc5b', // From existing profiles  
          specialty: 'Family Medicine',
          license_number: 'MD54321',
          active: true
        }
      ]
      
      const createdProviders = []
      for (const providerData of newProviders) {
        console.log(`🔄 Creating provider: ${providerData.specialty}`)
        
        const { data: newProvider, error: createError } = await supabase
          .from('providers')
          .insert(providerData)
          .select()
          .single()
        
        if (createError) {
          console.error(`❌ Failed to create provider: ${createError.message}`)
          continue
        }
        
        console.log(`✅ Created provider: ${newProvider.id}`)
        createdProviders.push(newProvider)
      }
      
      existingProviders.push(...createdProviders)
    }
    
    if (existingProviders.length === 0) {
      console.error('❌ Still no providers available')
      return
    }
    
    // Clear existing assignments for this patient
    console.log('🧹 Clearing existing assignments...')
    await supabase
      .from('patient_assignments')
      .delete()
      .eq('patient_id', patient.id)
    
    // Create patient assignments
    console.log('🔄 Creating patient assignments...')
    
    const treatmentTypes = ['general_care', 'weight_loss']
    
    for (let i = 0; i < Math.min(existingProviders.length, 2); i++) {
      const provider = existingProviders[i]
      const treatmentType = treatmentTypes[i] || 'general_care'
      const isPrimary = i === 0
      
      console.log(`  🔗 Assigning ${provider.specialty} provider (${treatmentType})`)
      
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
    
    // Verify with the exact query from authService
    console.log('🧪 Testing authService query...')
    
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
      
      // Test transformation
      console.log('')
      console.log('🔄 Testing data transformation for UI...')
      const transformedProviders = verification.map((assignment, index) => ({
        id: assignment.providers.id,
        name: `${assignment.providers.specialty} Provider`,
        specialty: assignment.providers.specialty,
        profile_id: assignment.providers.profile_id,
        treatment_type: assignment.treatment_type,
        is_primary: assignment.is_primary
      }))
      
      console.log('✅ Transformed providers for UI:')
      transformedProviders.forEach((provider, index) => {
        console.log(`   ${index + 1}. ${provider.name}`)
        console.log(`      ID: ${provider.id}`)
        console.log(`      Specialty: ${provider.specialty}`) 
        console.log(`      Treatment: ${provider.treatment_type}`)
      })
    }
    
    console.log('')
    console.log('🎉 Patient assignments created successfully!')
    console.log('📱 The visits booking dialog should now show real assigned providers!')
    
  } catch (error) {
    console.error('❌ Exception:', error)
  }
}

createCorrectAssignments()