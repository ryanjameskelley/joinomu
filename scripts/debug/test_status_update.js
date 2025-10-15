const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testStatusUpdate() {
  try {
    console.log('🔄 Testing direct status update...')

    // Get the preference ID that needs updating
    const preferenceId = 'fed39314-d631-4b36-b17d-a1215d7a1571'

    console.log('🔍 Current preference status:')
    const { data: before } = await supabase
      .from('patient_medication_preferences')
      .select('*')
      .eq('id', preferenceId)
      .single()
    
    console.log('Before:', before)

    // Try to update the status directly
    console.log('🔄 Attempting to update status to approved...')
    const { data: updated, error } = await supabase
      .from('patient_medication_preferences')
      .update({ 
        status: 'approved',
        preferred_dosage: '2.0mg',
        frequency: 'As needed'
      })
      .eq('id', preferenceId)
      .select()

    if (error) {
      console.error('❌ Error updating preference:', error)
    } else {
      console.log('✅ Successfully updated preference:', updated)
    }

    // Verify the update
    console.log('🔍 After update:')
    const { data: after } = await supabase
      .from('patient_medication_preferences')
      .select('*')
      .eq('id', preferenceId)
      .single()
    
    console.log('After:', after)

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

testStatusUpdate()