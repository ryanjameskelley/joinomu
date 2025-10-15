const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function checkTrackingEntries() {
  console.log('🔍 Checking medication tracking entries and patient medications...')
  
  const patientId = '419d8930-528f-4b7c-a2b0-3c62227c6bec'
  
  // Check medication tracking entries
  const { data: allEntries, error: allError } = await supabase
    .from('medication_tracking_entries')
    .select('*')
  
  console.log('📊 Total tracking entries in database:', allEntries?.length || 0)
  if (allError) console.error('❌ Error fetching all entries:', allError)
  
  const { data: patientEntries, error: patientError } = await supabase
    .from('medication_tracking_entries')
    .select('*')
    .eq('patient_id', patientId)
    
  console.log(`📊 Tracking entries for patient ${patientId}:`, patientEntries?.length || 0)
  if (patientError) console.error('❌ Error fetching patient entries:', patientError)
  
  // Check patient medication preferences
  console.log('🔍 Checking patient medication preferences...')
  const { data: prefs, error: prefsError } = await supabase
    .from('patient_medication_preferences')
    .select('*,medications(id,name,brand_name,generic_name,strength,dosage_form,category,active)')
    .eq('patient_id', patientId)
    .eq('status', 'approved')
    
  console.log(`💊 Medication preferences for patient ${patientId}:`, prefs?.length || 0)
  if (prefsError) console.error('❌ Error fetching preferences:', prefsError)
  
  if (prefs && prefs.length > 0) {
    console.log('📝 Sample medication preferences:', prefs.slice(0, 3))
  }
  
  // Check all patients with medication preferences
  const { data: allPrefs, error: allPrefsError } = await supabase
    .from('patient_medication_preferences')
    .select('patient_id,status')
    .eq('status', 'approved')
    
  if (allPrefs && allPrefs.length > 0) {
    const uniquePatientIds = [...new Set(allPrefs.map(p => p.patient_id))]
    console.log('👥 Patients with approved medication preferences:', uniquePatientIds)
    
    for (const pid of uniquePatientIds) {
      const count = allPrefs.filter(p => p.patient_id === pid).length
      console.log(`   - Patient ${pid}: ${count} approved medications`)
    }
  }
}

checkTrackingEntries().catch(console.error)