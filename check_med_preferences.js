const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMedicationPreferences() {
  console.log('🔍 Checking patient_medication_preferences table...')
  
  // First check what columns exist
  const { data: testData, error: testError } = await supabase
    .from('patient_medication_preferences')
    .select('*')
    .limit(1)
  
  if (testError) {
    console.error('❌ Error testing table:', testError)
    return
  }
  
  if (testData.length > 0) {
    console.log('Available columns:', Object.keys(testData[0]))
  }
  
  // Check patient_medication_preferences table
  const { data: preferences, error } = await supabase
    .from('patient_medication_preferences')
    .select(`
      *,
      medications (
        id,
        name,
        category
      )
    `)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('❌ Error fetching medication preferences:', error)
    return
  }
  
  console.log(`📊 Found ${preferences.length} total medication preferences`)
  
  // Filter for ones that need provider attention (based on available fields)
  const needsAttention = preferences.filter(p => 
    p.status === 'pending' ||
    p.status === 'awaiting_approval' ||
    p.refill_requested === true ||
    (p.needs_provider_attention && p.needs_provider_attention === true)
  )
  
  console.log(`📋 ${needsAttention.length} preferences need provider attention:`)
  
  needsAttention.forEach((pref, index) => {
    console.log(`\n${index + 1}. Medication Preference ID: ${pref.id}`)
    console.log(`   Medication: ${pref.medications.name} (${pref.medications.category})`)
    console.log(`   Patient ID: ${pref.patient_id}`)
    console.log(`   Status: ${pref.status}`)
    if (pref.needs_provider_attention) console.log(`   Needs Provider Attention: ${pref.needs_provider_attention}`)
    if (pref.refill_requested) console.log(`   Refill Requested: ${pref.refill_requested}`)
    console.log(`   Next Prescription Due: ${pref.next_prescription_due}`)
    console.log(`   Created: ${new Date(pref.created_at).toLocaleString()}`)
  })
  
  // Also check which providers should see these
  console.log('\n🔍 Checking provider assignments for these patients...')
  
  const patientIds = [...new Set(needsAttention.map(p => p.patient_id))]
  
  for (const patientId of patientIds) {
    const { data: assignments, error: assignError } = await supabase
      .from('provider_patient_assignments')
      .select(`
        provider_id,
        treatment_type,
        profiles!provider_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('patient_id', patientId)
    
    if (assignError) {
      console.error(`❌ Error fetching assignments for patient ${patientId}:`, assignError)
      continue
    }
    
    console.log(`\n👥 Patient ${patientId} assignments:`)
    assignments.forEach(assignment => {
      console.log(`   Provider: ${assignment.profiles?.first_name} ${assignment.profiles?.last_name} (${assignment.provider_id})`)
      console.log(`   Treatment Type: ${assignment.treatment_type}`)
    })
    
    // Check what medication preferences this patient has
    const patientPrefs = needsAttention.filter(p => p.patient_id === patientId)
    console.log(`   Medication preferences needing attention: ${patientPrefs.length}`)
    patientPrefs.forEach(pref => {
      console.log(`     - ${pref.medications.name} (${pref.medications.category})`)
    })
  }
}

checkMedicationPreferences().catch(console.error)