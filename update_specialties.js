const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateSpecialties() {
  try {
    console.log('🔄 Updating provider specialties and treatment types...')
    
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
    
    // Get current providers
    const { data: currentProviders, error: providersError } = await supabase
      .from('providers')
      .select('*')
      .eq('active', true)
    
    if (providersError) {
      console.error('❌ Error getting providers:', providersError)
      return
    }
    
    console.log(`✅ Found ${currentProviders.length} providers`)
    
    // Update the first two providers with correct specialties
    const correctSpecialties = ['Weight Loss', 'Mens Health']
    
    for (let i = 0; i < Math.min(currentProviders.length, 2); i++) {
      const provider = currentProviders[i]
      const newSpecialty = correctSpecialties[i]
      
      console.log(`🔄 Updating provider ${provider.id} to ${newSpecialty}`)
      
      const { data: updatedProvider, error: updateError } = await supabase
        .from('providers')
        .update({ specialty: newSpecialty })
        .eq('id', provider.id)
        .select()
        .single()
      
      if (updateError) {
        console.error(`❌ Failed to update provider: ${updateError.message}`)
      } else {
        console.log(`✅ Updated provider specialty: ${updatedProvider.specialty}`)
      }
    }
    
    // Clear existing assignments and create new ones with correct treatment types
    console.log('🧹 Clearing existing assignments...')
    await supabase
      .from('patient_assignments')
      .delete()
      .eq('patient_id', patient.id)
    
    // Get updated providers
    const { data: updatedProviders, error: updatedError } = await supabase
      .from('providers')
      .select('*')
      .eq('active', true)
      .limit(2)
    
    if (updatedError) {
      console.error('❌ Error getting updated providers:', updatedError)
      return
    }
    
    console.log('🔄 Creating assignments with correct treatment types...')
    
    const treatmentTypes = ['weight_loss', 'mens_health']
    
    for (let i = 0; i < updatedProviders.length; i++) {
      const provider = updatedProviders[i]
      const treatmentType = treatmentTypes[i]
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
    
    // Final verification
    console.log('🧪 Final verification...')
    
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
      console.log('✅ Final verification successful!')
      console.log(`   Found ${verification.length} assignments:`)
      verification.forEach((assignment, index) => {
        const provider = assignment.providers
        console.log(`   ${index + 1}. ${provider.specialty} (ID: ${provider.id})`)
        console.log(`      Treatment: ${assignment.treatment_type}`)
        console.log(`      Primary: ${assignment.is_primary}`)
      })
    }
    
    console.log('')
    console.log('🎉 Specialties and treatment types updated successfully!')
    console.log('📱 The visits booking dialog will now show Weight Loss and Mens Health providers!')
    
  } catch (error) {
    console.error('❌ Exception:', error)
  }
}

updateSpecialties()