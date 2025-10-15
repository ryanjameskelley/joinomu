const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function checkMedicationsCatalog() {
  console.log('🔍 Checking medications catalog...')
  
  // Check medications table
  const { data: medications, error: medError } = await supabase
    .from('medications')
    .select('*')
  
  console.log('💊 Total medications in catalog:', medications?.length || 0)
  if (medError) console.error('❌ Error fetching medications:', medError)
  
  if (medications && medications.length > 0) {
    console.log('📝 Sample medications:', medications.slice(0, 5))
    
    // Group by category
    const categories = medications.reduce((acc, med) => {
      const cat = med.category || 'uncategorized'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(med.name)
      return acc
    }, {})
    
    console.log('📊 Medications by category:')
    Object.entries(categories).forEach(([cat, meds]) => {
      console.log(`   - ${cat}: ${meds.length} medications`)
    })
  }
  
  // Check patient medication preferences to see structure expected
  const { data: prefs, error: prefsError } = await supabase
    .from('patient_medication_preferences')
    .select('*')
    .limit(3)
    
  console.log('🔍 Sample patient preferences structure:', prefs?.length || 0, 'entries')
  if (prefs && prefs.length > 0) {
    console.log('📝 Sample preference:', prefs[0])
  }
}

checkMedicationsCatalog().catch(console.error)