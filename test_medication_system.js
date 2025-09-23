const { createClient } = require('@supabase/supabase-js')

// Use your local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMedicationSystem() {
  console.log('🧪 Testing Medication Management System...\n')

  try {
    // Test 1: Check medications table
    console.log('📋 1. Testing medications catalog...')
    const { data: medications, error: medError } = await supabase
      .from('medications')
      .select('*')
      .limit(5)

    if (medError) {
      console.error('❌ Error fetching medications:', medError)
    } else {
      console.log(`✅ Found ${medications.length} medications in catalog`)
      console.log('Sample medications:', medications.map(m => `${m.name} (${m.category})`).join(', '))
    }

    // Test 2: Check patient medication preferences
    console.log('\n💊 2. Testing patient medication preferences...')
    const { data: preferences, error: prefError } = await supabase
      .from('patient_medication_preferences')
      .select(`
        *,
        medications(name, category),
        patients(id)
      `)

    if (prefError) {
      console.error('❌ Error fetching preferences:', prefError)
    } else {
      console.log(`✅ Found ${preferences.length} patient medication preferences`)
      if (preferences.length > 0) {
        console.log('Sample preference:', preferences[0])
      }
    }

    // Test 3: Check medication approvals
    console.log('\n👨‍⚕️ 3. Testing medication approvals...')
    const { data: approvals, error: appError } = await supabase
      .from('medication_approvals')
      .select(`
        *,
        patient_medication_preferences(
          medications(name)
        )
      `)

    if (appError) {
      console.error('❌ Error fetching approvals:', appError)
    } else {
      console.log(`✅ Found ${approvals.length} medication approvals`)
      if (approvals.length > 0) {
        console.log('Sample approval:', approvals[0])
      }
    }

    // Test 4: Check medication orders
    console.log('\n💳 4. Testing medication orders...')
    const { data: orders, error: ordError } = await supabase
      .from('medication_orders')
      .select(`
        *,
        medications(name),
        patients(id)
      `)

    if (ordError) {
      console.error('❌ Error fetching orders:', ordError)
    } else {
      console.log(`✅ Found ${orders.length} medication orders`)
      if (orders.length > 0) {
        console.log('Sample order:', orders[0])
      }
    }

    // Test 5: Test helper functions
    console.log('\n🔧 5. Testing helper functions...')
    
    // Test admin fulfillment queue function
    const { data: fulfillmentQueue, error: queueError } = await supabase
      .rpc('get_admin_fulfillment_queue')

    if (queueError) {
      console.error('❌ Error fetching fulfillment queue:', queueError)
    } else {
      console.log(`✅ Admin fulfillment queue: ${fulfillmentQueue.length} orders`)
    }

    console.log('\n🎉 Medication system test completed!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testMedicationSystem()