const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)
const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function investigateMissingApprovals() {
  const pendingIds = [
    '1a52fc52-5390-453b-ba60-0c51ff11fca9',
    'fd299047-ccd1-4a3c-b7fb-7485bd8b40f0', 
    '0aa0ec28-298a-4651-9dd4-65327aade765'
  ]
  
  console.log('🔍 Investigating why only 1 of 3 pending medication preferences appears in approvals...')
  
  // First, let's see ALL preferences in the table using service role to bypass RLS
  console.log('\n📊 Checking ALL preferences in patient_medication_preferences table:')
  const { data: allPrefs, error: allError } = await serviceSupabase
    .from('patient_medication_preferences')
    .select(`
      *,
      medications (
        id,
        name,
        category
      )
    `)
    .order('created_at', { ascending: false })
  
  if (allError) {
    console.error('❌ Error fetching all preferences:', allError)
    return
  }
  
  console.log(`Found ${allPrefs.length} total preferences:`)
  allPrefs.forEach((pref, index) => {
    console.log(`${index + 1}. ID: ${pref.id}`)
    console.log(`   - Medication: ${pref.medications?.name}`)
    console.log(`   - Status: ${pref.status}`)
    console.log(`   - Refill Requested: ${pref.refill_requested}`)
    console.log(`   - Patient ID: ${pref.patient_id}`)
    console.log(`   - Created: ${pref.created_at}`)
    console.log(`   - Should show in approvals: ${(pref.status === 'pending' && pref.refill_requested === true) || pref.status === 'needs_review'}`)
    console.log('')
  })
  
  // Check if the specific IDs exist
  console.log('\n🔍 Checking if the specific pending IDs exist:')
  for (const id of pendingIds) {
    const found = allPrefs.find(p => p.id === id)
    if (found) {
      console.log(`✅ Found ${id}: ${found.medications?.name}, status: ${found.status}, refill_requested: ${found.refill_requested}`)
    } else {
      console.log(`❌ ID ${id} not found in table`)
    }
  }
  
  console.log('\n🔍 Checking what the provider dashboard query criteria are...')
  
  // Check what filters are applied in the provider dashboard
  console.log('Provider dashboard filters:')
  console.log('1. status === "pending" && refill_requested === true')
  console.log('2. OR status === "needs_review"')
  
  // Check which preferences meet the approval criteria
  console.log('\n📊 Preferences that should show in approvals:')
  const shouldShowInApprovals = allPrefs.filter(pref => 
    (pref.status === 'pending' && pref.refill_requested === true) || pref.status === 'needs_review'
  )
  
  console.log(`Found ${shouldShowInApprovals.length} preferences that meet approval criteria:`)
  shouldShowInApprovals.forEach((pref, index) => {
    console.log(`${index + 1}. ${pref.id} - ${pref.medications?.name}`)
    console.log(`   Status: ${pref.status}, Refill Requested: ${pref.refill_requested}`)
    console.log(`   Patient ID: ${pref.patient_id}`)
  })
  
  // Now check patient assignments for these preferences
  console.log('\n🔍 Checking patient assignments for preferences that should show in approvals...')
  
  for (const pref of shouldShowInApprovals) {
    console.log(`\nChecking assignments for preference ${pref.id} (patient ${pref.patient_id}):`)
    
    // Try to find patient assignments using service role
    try {
      const { data: assignments, error: assignError } = await serviceSupabase
        .from('provider_patient_assignments')
        .select('*')
        .eq('patient_id', pref.patient_id)
      
      if (assignError) {
        console.log(`   ❌ Error checking assignments: ${assignError.message}`)
      } else if (assignments && assignments.length > 0) {
        console.log(`   ✅ Found ${assignments.length} assignments:`)
        assignments.forEach(assignment => {
          console.log(`     - Provider: ${assignment.provider_id}`)
          console.log(`     - Treatment Type: ${assignment.treatment_type}`)
        })
      } else {
        console.log(`   ❌ No provider assignments found for patient ${pref.patient_id}`)
      }
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`)
    }
  }
}

investigateMissingApprovals().catch(console.error)