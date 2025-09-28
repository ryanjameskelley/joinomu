const { createClient } = require('@supabase/supabase-js')

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function debugQueryResult() {
  try {
    const providerId = 'a44b32bb-00a5-460d-a18b-4468d59d0318'
    
    console.log('🔍 Testing different query approaches...')
    
    // 1. Basic query without filters
    console.log('\n1. Basic query (no filters):')
    const { data: basic, error: basicError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .limit(3)
    
    if (basicError) {
      console.error('❌ Basic query error:', basicError)
    } else {
      console.log(`✅ Found ${basic.length} schedules`)
      if (basic.length > 0) {
        console.log('Sample record:', {
          id: basic[0].id,
          day_of_week: basic[0].day_of_week,
          treatment_types: basic[0].treatment_types,
          start_time: basic[0].start_time,
          end_time: basic[0].end_time
        })
      }
    }
    
    // 2. Try the same filter the app is using (which fails)
    console.log('\n2. App filter (treatment_type = weight_loss):')
    const { data: appFilter, error: appError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .eq('treatment_type', 'weight_loss')
    
    if (appError) {
      console.error('❌ App filter error:', appError.message)
    } else {
      console.log(`✅ App filter found ${appFilter.length} schedules`)
    }
    
    // 3. Try array contains filter (correct approach)
    console.log('\n3. Array contains filter (treatment_types @> ["weight_loss"]):')
    const { data: arrayFilter, error: arrayError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .contains('treatment_types', ['weight_loss'])
    
    if (arrayError) {
      console.error('❌ Array filter error:', arrayError.message)
    } else {
      console.log(`✅ Array filter found ${arrayFilter.length} schedules`)
      if (arrayFilter.length > 0) {
        console.log('Sample record:', {
          day_of_week: arrayFilter[0].day_of_week,
          treatment_types: arrayFilter[0].treatment_types,
          start_time: arrayFilter[0].start_time
        })
      }
    }
    
    // 4. Show what needs to be fixed in the app
    console.log('\n🔧 SOLUTION:')
    if (basic.length > 0 && arrayFilter.length > 0) {
      console.log('The provider has schedules, but the app is using the wrong filter.')
      console.log('The app queries: .eq("treatment_type", "weight_loss")')
      console.log('But should query: .contains("treatment_types", ["weight_loss"])')
      console.log('\nThe issue is in the auth-service.ts file where it filters schedules.')
    } else {
      console.log('Need to check if schedules exist and have correct treatment_types')
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error)
  }
}

debugQueryResult()