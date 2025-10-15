const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function debugMedicationStatus() {
  console.log('🔍 Debugging medication status for patient...')
  
  const patientId = '419d8930-528f-4b7c-a2b0-3c62227c6bec'
  
  // Check what the service call returns
  const { data: allPreferences, error } = await supabase
    .from('patient_medication_preferences')
    .select('*,medications(id,name,brand_name,generic_name,strength,dosage_form,category,active)')
    .eq('patient_id', patientId)
    .in('status', ['approved', 'pending'])
    
  console.log('📊 All preferences (approved + pending):', allPreferences?.length || 0)
  if (error) console.error('❌ Error:', error)
  
  if (allPreferences && allPreferences.length > 0) {
    console.log('📝 Preferences found:')
    allPreferences.forEach(pref => {
      console.log(`   - ${pref.medications?.name} (${pref.preferred_dosage}) - Status: ${pref.status}`)
    })
    
    const approved = allPreferences.filter(p => p.status === 'approved')
    const pending = allPreferences.filter(p => p.status === 'pending')
    
    console.log(`✅ Approved medications: ${approved.length}`)
    console.log(`⏳ Pending medications: ${pending.length}`)
    
    // This is what should determine the UI state
    if (approved.length > 0) {
      console.log('🎯 UI should show: Medication cards with tracking buttons')
    } else if (pending.length > 0) {
      console.log('🎯 UI should show: "No medications available - pending approval" message')
    } else {
      console.log('🎯 UI should show: "No approved medications" message')
    }
  } else {
    console.log('🎯 UI should show: "No approved medications" message (no preferences found)')
  }
}

debugMedicationStatus().catch(console.error)