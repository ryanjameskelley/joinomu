// Check what's actually in the assignments table
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAssignments() {
  console.log('🔍 Checking Assignments Table')
  console.log('============================')

  const { data: assignments, error } = await supabase
    .from('patient_assignments')
    .select(`
      *,
      patients!patient_assignments_patient_id_fkey (
        id,
        profile_id,
        profiles!patients_profile_id_fkey (
          first_name,
          last_name,
          email
        )
      ),
      providers!patient_assignments_provider_id_fkey (
        id,
        profile_id,
        profiles!providers_profile_id_fkey (
          first_name,
          last_name
        )
      )
    `)

  if (error) {
    console.log('❌ Error:', error)
    return
  }

  console.log(`Found ${assignments?.length || 0} assignments:`)
  assignments?.forEach(a => {
    console.log(`\n📋 Assignment ${a.id}:`)
    console.log(`   Patient: ${a.patients?.profiles?.first_name} ${a.patients?.profiles?.last_name} (${a.patients?.profiles?.email})`)
    console.log(`   Provider: ${a.providers?.profiles?.first_name} ${a.providers?.profiles?.last_name}`)
    console.log(`   Treatment: ${a.treatment_type}`)
    console.log(`   Primary: ${a.is_primary}`)
    console.log(`   Assigned: ${a.assigned_date}`)
    console.log(`   Active: ${a.active}`)
  })

  // Now test the provider function directly with the actual provider profile ID
  if (assignments && assignments.length > 0) {
    const providerProfileId = assignments[0].providers?.profile_id
    console.log(`\n🧪 Testing provider function with profile ID: ${providerProfileId}`)
    
    const { data: providerPatients, error: providerError } = await supabase
      .rpc('get_assigned_patients_for_provider', {
        provider_profile_id: providerProfileId
      })

    if (providerError) {
      console.log('❌ Provider function error:', providerError)
    } else {
      console.log(`✅ Provider function result: ${providerPatients?.length || 0} patients`)
      providerPatients?.forEach(p => {
        console.log(`   - ${p.first_name} ${p.last_name} (${p.treatment_type})`)
      })
    }
  }
}

checkAssignments().catch(console.error)