import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xxhkwgkbdzhwapudijzq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4aGt3Z2tiZHpod2FwdWRpanpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDY0OTcyOCwiZXhwIjoyMDUwMjI1NzI4fQ.Q1SFHP3NRAj3lRJIaGsb_gKpWEeZ4cVvAqzXz7hNDRo'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProviders() {
  try {
    console.log('Checking existing providers...')
    
    // Get all providers
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('id, profile_id, email, name, created_at')
      .order('created_at')

    if (providersError) {
      console.error('Error fetching providers:', providersError)
      return
    }

    console.log(`\nFound ${providers.length} providers:`)
    providers.forEach((provider, index) => {
      console.log(`${index + 1}. ID: ${provider.id}`)
      console.log(`   Profile ID: ${provider.profile_id}`)
      console.log(`   Email: ${provider.email}`)
      console.log(`   Name: ${provider.name}`)
      console.log(`   Created: ${provider.created_at}`)
      console.log('')
    })

    // Check current patient assignments
    console.log('Current patient assignments:')
    const { data: assignments, error: assignError } = await supabase
      .from('patient_provider_assignments')
      .select(`
        provider_id,
        patient_id,
        providers(email, name),
        patients(email, name)
      `)

    if (assignError) {
      console.error('Error fetching assignments:', assignError)
      return
    }

    const assignmentsByProvider = {}
    assignments.forEach(assignment => {
      const providerEmail = assignment.providers.email
      if (!assignmentsByProvider[providerEmail]) {
        assignmentsByProvider[providerEmail] = []
      }
      assignmentsByProvider[providerEmail].push({
        patientId: assignment.patient_id,
        patientEmail: assignment.patients.email,
        patientName: assignment.patients.name
      })
    })

    Object.keys(assignmentsByProvider).forEach(providerEmail => {
      console.log(`\nProvider: ${providerEmail}`)
      console.log(`Assigned patients: ${assignmentsByProvider[providerEmail].length}`)
      assignmentsByProvider[providerEmail].forEach((patient, index) => {
        console.log(`  ${index + 1}. ${patient.patientName} (${patient.patientEmail})`)
      })
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

checkProviders()