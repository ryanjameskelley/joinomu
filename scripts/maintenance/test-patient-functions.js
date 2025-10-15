// Test the new patient query functions
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testPatientFunctions() {
  console.log('🧪 Testing Patient Query Functions')
  console.log('==================================')

  // First, let's see what data we have
  const { data: allProfiles } = await supabase.from('profiles').select('*')
  const { data: allPatients } = await supabase.from('patients').select('*')
  const { data: allProviders } = await supabase.from('providers').select('*')
  const { data: allAssignments } = await supabase.from('patient_assignments').select('*')

  console.log(`\n📊 Current Database State:`)
  console.log(`   Profiles: ${allProfiles?.length || 0}`)
  console.log(`   Patients: ${allPatients?.length || 0}`)
  console.log(`   Providers: ${allProviders?.length || 0}`)
  console.log(`   Assignments: ${allAssignments?.length || 0}`)

  if (allProfiles?.length) {
    console.log('\n👥 Profiles:')
    allProfiles.forEach(p => console.log(`   - ${p.first_name} ${p.last_name} (${p.role}) - ${p.id}`))
  }

  // Test creating a sample assignment if we have patients and providers
  const patients = allPatients?.filter(p => p.profile_id) || []
  const providers = allProviders?.filter(p => p.profile_id) || []

  if (patients.length > 0 && providers.length > 0) {
    console.log('\n🔗 Testing patient assignment...')
    
    const patientProfileId = patients[0].profile_id
    const providerProfileId = providers[0].profile_id
    
    console.log(`   Assigning patient ${patientProfileId} to provider ${providerProfileId}`)
    
    const { data: assignmentResult, error: assignmentError } = await supabase
      .rpc('assign_patient_to_provider', {
        patient_profile_id: patientProfileId,
        provider_profile_id: providerProfileId,
        treatment_type_param: 'primary_care',
        is_primary_param: true
      })

    if (assignmentError) {
      console.log('❌ Assignment failed:', assignmentError)
    } else {
      console.log('✅ Assignment result:', assignmentResult)
    }
  }

  // Test admin function - get all patients
  console.log('\n👑 Testing Admin Function: get_all_patients_for_admin()')
  const { data: adminPatients, error: adminError } = await supabase
    .rpc('get_all_patients_for_admin')

  if (adminError) {
    console.log('❌ Admin query failed:', adminError)
  } else {
    console.log(`✅ Admin sees ${adminPatients?.length || 0} patients:`)
    adminPatients?.forEach(p => {
      console.log(`   - ${p.first_name} ${p.last_name} (${p.email})`)
      console.log(`     Providers: ${p.assigned_providers?.join(', ') || 'None'}`)
      console.log(`     Treatments: ${p.treatment_types?.join(', ') || 'None'}`)
      console.log(`     Intake: ${p.has_completed_intake ? 'Complete' : 'Pending'}`)
    })
  }

  // Test provider function - get assigned patients
  if (providers.length > 0) {
    console.log('\n👨‍⚕️ Testing Provider Function: get_assigned_patients_for_provider()')
    const providerProfileId = providers[0].profile_id
    
    const { data: providerPatients, error: providerError } = await supabase
      .rpc('get_assigned_patients_for_provider', {
        provider_profile_id: providerProfileId
      })

    if (providerError) {
      console.log('❌ Provider query failed:', providerError)
    } else {
      console.log(`✅ Provider sees ${providerPatients?.length || 0} assigned patients:`)
      providerPatients?.forEach(p => {
        console.log(`   - ${p.first_name} ${p.last_name} (${p.email})`)
        console.log(`     Treatment: ${p.treatment_type}`)
        console.log(`     Assigned: ${p.assigned_date}`)
        console.log(`     Primary: ${p.is_primary ? 'Yes' : 'No'}`)
      })
    }
  }

  // Test helper function - get provider by profile ID
  if (providers.length > 0) {
    console.log('\n🔍 Testing Helper Function: get_provider_by_profile_id()')
    const providerProfileId = providers[0].profile_id
    
    const { data: providerDetails, error: providerDetailsError } = await supabase
      .rpc('get_provider_by_profile_id', {
        provider_profile_id: providerProfileId
      })

    if (providerDetailsError) {
      console.log('❌ Provider details query failed:', providerDetailsError)
    } else {
      console.log(`✅ Provider details:`)
      providerDetails?.forEach(p => {
        console.log(`   - ${p.first_name} ${p.last_name}`)
        console.log(`     Specialty: ${p.specialty}`)
        console.log(`     License: ${p.license_number}`)
        console.log(`     Active: ${p.active}`)
      })
    }
  }
}

testPatientFunctions().catch(console.error)