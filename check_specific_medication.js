const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function checkSpecificMedication() {
  console.log('🔍 Checking for medication preference ID: c96a9417-b343-4841-b07d-cc3e4d820ac4')
  
  // Check if this ID exists in patient_medication_preferences
  const { data: preference, error: prefError } = await supabase
    .from('patient_medication_preferences')
    .select('*,medications(id,name,brand_name,generic_name,strength,dosage_form,category,active)')
    .eq('id', 'c96a9417-b343-4841-b07d-cc3e4d820ac4')
    .single()
    
  if (prefError) {
    console.error('❌ Error fetching specific preference:', prefError)
  } else if (preference) {
    console.log('✅ Found medication preference:', preference)
    console.log('👤 Patient ID for this preference:', preference.patient_id)
    console.log('💊 Medication details:', preference.medications)
  } else {
    console.log('❌ No medication preference found with ID: c96a9417-b343-4841-b07d-cc3e4d820ac4')
  }
  
  // Also check all medication preferences to see what IDs exist
  const { data: allPrefs, error: allError } = await supabase
    .from('patient_medication_preferences')
    .select('id,patient_id,status,medications(name)')
    .eq('status', 'approved')
    
  if (allPrefs && allPrefs.length > 0) {
    console.log('\n🔍 All approved medication preference IDs:')
    allPrefs.forEach(pref => {
      console.log(`   - ID: ${pref.id}, Patient: ${pref.patient_id}, Medication: ${pref.medications?.name}`)
    })
  }
}

checkSpecificMedication().catch(console.error)