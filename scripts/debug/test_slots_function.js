// Test if the get_available_slots_for_provider function exists
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function testSlotsFunction() {
  console.log('🔍 Testing get_available_slots_for_provider function...')
  
  try {
    const { data, error } = await supabase
      .rpc('get_available_slots_for_provider', {
        p_provider_id: '82e5ac4f-8fd0-47d3-9bdf-a51b66044939',
        p_start_date: '2025-09-29',
        p_end_date: '2025-09-29',
        p_treatment_type: 'weight_loss'
      })
    
    if (error) {
      console.log('❌ Function error:', error)
      
      // Try the fallback function name
      console.log('🔍 Trying fallback function name...')
      const { data: fallbackData, error: fallbackError } = await supabase
        .rpc('get_available_slots', {
          provider_id: '82e5ac4f-8fd0-47d3-9bdf-a51b66044939',
          start_date: '2025-09-29',
          end_date: '2025-09-29',
          treatment_type: 'weight_loss'
        })
      
      if (fallbackError) {
        console.log('❌ Fallback function error:', fallbackError)
      } else {
        console.log('✅ Fallback function works:', fallbackData?.length || 0, 'slots')
      }
    } else {
      console.log('✅ Function works:', data?.length || 0, 'slots')
    }
    
    // List all available RPC functions
    console.log('🔍 Checking what RPC functions exist...')
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .like('proname', '%slot%')
      .limit(10)
      .catch(() => ({ data: null, error: 'Cannot access pg_proc' }))
    
    if (functions) {
      console.log('Available slot-related functions:', functions.map(f => f.proname))
    } else {
      console.log('Cannot list functions')
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testSlotsFunction().catch(console.error)