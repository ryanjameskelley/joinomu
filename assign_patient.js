const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function assignPatient() {
  try {
    // First find existing provider
    console.log('Looking up provider with profile_id: cbbd85bf-c404-4345-b740-6c0cbbe61f46')
    let { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('profile_id', 'cbbd85bf-c404-4345-b740-6c0cbbe61f46')
      .single()

    if (providerError && providerError.code === 'PGRST116') {
      console.log('Provider not found, creating...')
      const { data: newProvider, error: createProviderError } = await supabase
        .from('providers')
        .insert({
          profile_id: '250d41c5-b071-4520-96d0-5eaafa73f9dc',
          specialty: 'weight loss',
          license_number: '1234567890',
          active: true
        })
        .select('id')
        .single()

      if (createProviderError) {
        console.error('Error creating provider:', createProviderError)
        return
      }
      provider = newProvider
    } else if (providerError) {
      console.error('Error finding provider:', providerError)
      return
    }

    console.log('Found/created provider:', provider)

    // Find existing patient
    console.log('Looking up patient with profile_id: 2c4f1ca5-70b3-495e-a8da-816c36503aa2')
    let { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('profile_id', '2c4f1ca5-70b3-495e-a8da-816c36503aa2')
      .single()

    if (patientError && patientError.code === 'PGRST116') {
      console.log('Patient not found, creating...')
      const { data: newPatient, error: createPatientError } = await supabase
        .from('patients')
        .insert({
          profile_id: '9fdbb605-ed18-46fc-8eac-d1e3775ca004',
          has_completed_intake: false
        })
        .select('id')
        .single()

      if (createPatientError) {
        console.error('Error creating patient:', createPatientError)
        return
      }
      patient = newPatient
    } else if (patientError) {
      console.error('Error finding patient:', patientError)
      return
    }

    console.log('Found/created patient:', patient)

    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('provider_id', provider.id)
      .single()

    if (existingAssignment) {
      console.log('Assignment already exists:', existingAssignment)
      
      // Update to active if inactive
      if (!existingAssignment.active) {
        const { data: updated, error: updateError } = await supabase
          .from('patient_assignments')
          .update({ active: true, assigned_date: new Date().toISOString() })
          .eq('id', existingAssignment.id)
          .select()

        if (updateError) {
          console.error('Error updating assignment:', updateError)
        } else {
          console.log('Updated assignment to active:', updated)
        }
      }
      return
    }

    // Create new assignment
    console.log('Creating new patient assignment...')
    const { data: assignment, error: assignmentError } = await supabase
      .from('patient_assignments')
      .insert({
        patient_id: patient.id,
        provider_id: provider.id,
        assigned_date: new Date().toISOString(),
        active: true,
        is_primary: true
      })
      .select()

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError)
    } else {
      console.log('Successfully assigned patient to provider:', assignment)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

assignPatient()