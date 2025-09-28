#!/usr/bin/env node

/**
 * Assign provider to patient
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function assignProviderToPatient() {
  const providerId = '7ff72638-eac1-4fbd-b197-8c024d05bd2a'
  const patientId = 'e92fcabd-95a9-442d-b634-aad585af12a8'
  
  console.log('🔗 Assigning provider to patient...')
  console.log('Provider ID:', providerId)
  console.log('Patient ID:', patientId)
  
  try {
    // 1. Verify provider exists
    console.log('1️⃣ Verifying provider exists...')
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('profile_id', providerId)
      .single()
    
    if (providerError || !provider) {
      console.error('❌ Provider not found:', providerError)
      return
    }
    
    console.log('✅ Provider found:', provider.first_name, provider.last_name)
    
    // 2. Verify patient exists
    console.log('2️⃣ Verifying patient exists...')
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', patientId)
      .single()
    
    if (patientError || !patient) {
      console.error('❌ Patient not found:', patientError)
      return
    }
    
    console.log('✅ Patient found:', patient.id)
    
    // 3. Check if assignment already exists
    console.log('3️⃣ Checking for existing assignment...')
    const { data: existingAssignment, error: existingError } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('provider_id', provider.id)
      .eq('patient_id', patient.id)
      .single()
    
    if (existingAssignment) {
      console.log('✅ Assignment already exists:', existingAssignment)
      return
    }
    
    // 4. Create the assignment
    console.log('4️⃣ Creating provider-patient assignment...')
    const { data: assignment, error: assignmentError } = await supabase
      .from('patient_assignments')
      .insert({
        provider_id: provider.id,
        patient_id: patient.id,
        treatment_type: 'weight_loss',
        active: true
      })
      .select()
      .single()
    
    if (assignmentError) {
      console.error('❌ Error creating assignment:', assignmentError)
      return
    }
    
    console.log('✅ Assignment created successfully:', assignment)
    
    // 5. Verify the assignment works
    console.log('5️⃣ Verifying assignment...')
    const { data: verification, error: verifyError } = await supabase
      .from('patient_assignments')
      .select(`
        *,
        provider:providers(*),
        patient:patients(*)
      `)
      .eq('id', assignment.id)
      .single()
    
    if (verifyError) {
      console.error('❌ Error verifying assignment:', verifyError)
    } else {
      console.log('✅ Assignment verified:', {
        id: verification.id,
        provider: verification.provider?.first_name + ' ' + verification.provider?.last_name,
        patient_id: verification.patient?.id,
        status: verification.status
      })
    }
    
    console.log('\n🎉 SUCCESS: Provider successfully assigned to patient!')
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

assignProviderToPatient()
