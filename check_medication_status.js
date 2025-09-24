const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkMedicationStatus() {
  try {
    console.log('🔍 Checking medication preferences status...')

    // Get patient1's patient ID
    const { data: patientData } = await supabase
      .from('patients')
      .select('id, profile_id')
      .eq('profile_id', (await supabase.from('profiles').select('id').eq('email', 'patient1@test.com').single()).data?.id)
      .single()

    if (!patientData) {
      console.log('❌ No patient found for patient1@test.com')
      return
    }

    console.log('✅ Found patient:', patientData)

    // Check medication preferences
    const { data: preferences } = await supabase
      .from('patient_medication_preferences')
      .select('*')
      .eq('patient_id', patientData.id)

    console.log('📋 Medication preferences:')
    preferences?.forEach(pref => {
      console.log(`  - ID: ${pref.id}`)
      console.log(`    Status: ${pref.status}`)
      console.log(`    Dosage: ${pref.preferred_dosage}`)
      console.log(`    Frequency: ${pref.frequency}`)
      console.log(`    Updated: ${pref.updated_at}`)
      console.log('')
    })

    // Check medication approvals
    const { data: approvals } = await supabase
      .from('medication_approvals')
      .select('*')

    console.log('✅ Medication approvals:')
    approvals?.forEach(approval => {
      console.log(`  - ID: ${approval.id}`)
      console.log(`    Preference ID: ${approval.preference_id}`)
      console.log(`    Status: ${approval.status}`)
      console.log(`    Approved Dosage: ${approval.approved_dosage}`)
      console.log(`    Approved Frequency: ${approval.approved_frequency}`)
      console.log(`    Provider Notes: ${approval.provider_notes}`)
      console.log('')
    })

    // Check medication orders
    const { data: orders } = await supabase
      .from('medication_orders')
      .select('*')

    console.log('📦 Medication orders:')
    orders?.forEach(order => {
      console.log(`  - ID: ${order.id}`)
      console.log(`    Approval ID: ${order.approval_id}`)
      console.log(`    Patient ID: ${order.patient_id}`)
      console.log(`    Payment Status: ${order.payment_status}`)
      console.log(`    Fulfillment Status: ${order.fulfillment_status}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error checking status:', error)
  }
}

checkMedicationStatus()