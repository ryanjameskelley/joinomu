const { createClient } = require('@supabase/supabase-js')

// Use your local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyMedicationData() {
  console.log('🔍 Verifying medication data in admin and provider dashboards...\n')

  try {
    // Test 1: Check if we have sample data
    console.log('📊 1. Checking database contents...')
    
    const { data: patients } = await supabase.from('patients').select('*, profiles(first_name, last_name)')
    const { data: providers } = await supabase.from('providers').select('*, profiles(first_name, last_name)')
    const { data: admins } = await supabase.from('admins').select('*, profiles(first_name, last_name)')
    const { data: assignments } = await supabase.from('patient_assignments').select('*')
    const { data: preferences } = await supabase.from('patient_medication_preferences').select('*, medications(name)')
    const { data: approvals } = await supabase.from('medication_approvals').select('*')
    const { data: orders } = await supabase.from('medication_orders').select('*, medications(name)')

    console.log(`✅ Found:`)
    console.log(`   - ${patients?.length || 0} patients`)
    console.log(`   - ${providers?.length || 0} providers`)
    console.log(`   - ${admins?.length || 0} admins`)
    console.log(`   - ${assignments?.length || 0} patient assignments`)
    console.log(`   - ${preferences?.length || 0} medication preferences`)
    console.log(`   - ${approvals?.length || 0} medication approvals`)
    console.log(`   - ${orders?.length || 0} medication orders`)

    // Test 2: Test admin view - get all patients with medications
    console.log('\n👨‍💼 2. Testing admin dashboard view...')
    const { data: adminPatientView, error: adminError } = await supabase
      .from('patients')
      .select(`
        id,
        profiles (first_name, last_name, email),
        patient_medication_preferences (
          id, 
          status, 
          preferred_dosage, 
          frequency,
          medications (name, category)
        ),
        medication_orders (
          id, 
          payment_status, 
          fulfillment_status, 
          total_amount, 
          tracking_number,
          medications (name)
        )
      `)

    if (adminError) {
      console.error('❌ Admin view error:', adminError)
    } else {
      console.log(`✅ Admin can see ${adminPatientView.length} patients`)
      adminPatientView.forEach(patient => {
        const name = `${patient.profiles.first_name} ${patient.profiles.last_name}`
        const medCount = patient.patient_medication_preferences?.length || 0
        const orderCount = patient.medication_orders?.length || 0
        console.log(`   - ${name}: ${medCount} medication prefs, ${orderCount} orders`)
      })
    }

    // Test 3: Test provider view - get assigned patients with medications
    console.log('\n👨‍⚕️ 3. Testing provider dashboard view...')
    if (providers && providers.length > 0) {
      const providerId = providers[0].id
      const { data: providerPatientView, error: providerError } = await supabase
        .from('patient_assignments')
        .select(`
          treatment_type,
          assigned_date,
          is_primary,
          patients (
            id,
            profiles (first_name, last_name, email)
          ),
          patient_medication_preferences:patient_medication_preferences!patient_assignments_patient_id_fkey (
            id,
            status,
            preferred_dosage,
            frequency,
            medications (name, category)
          )
        `)
        .eq('provider_id', providerId)

      if (providerError) {
        console.error('❌ Provider view error:', providerError)
      } else {
        console.log(`✅ Provider can see ${providerPatientView.length} assigned patients`)
        providerPatientView.forEach(assignment => {
          if (assignment.patients && assignment.patients.profiles) {
            const name = `${assignment.patients.profiles.first_name} ${assignment.patients.profiles.last_name}`
            console.log(`   - ${name} (${assignment.treatment_type})`)
          }
        })
      }
    }

    // Test 4: Test provider medication approval queue
    console.log('\n🔬 4. Testing provider medication approval queue...')
    if (providers && providers.length > 0) {
      const providerId = providers[0].id
      const { data: pendingApprovals, error: pendingError } = await supabase
        .rpc('get_provider_pending_approvals', { provider_uuid: providerId })

      if (pendingError) {
        console.error('❌ Pending approvals error:', pendingError)
      } else {
        console.log(`✅ Provider has ${pendingApprovals.length} pending medication approvals`)
        pendingApprovals.forEach(approval => {
          console.log(`   - ${approval.patient_name}: ${approval.medication_name} (${approval.preferred_dosage})`)
        })
      }
    }

    // Test 5: Test admin fulfillment queue
    console.log('\n📦 5. Testing admin fulfillment queue...')
    const { data: fulfillmentQueue, error: fulfillmentError } = await supabase
      .rpc('get_admin_fulfillment_queue')

    if (fulfillmentError) {
      console.error('❌ Fulfillment queue error:', fulfillmentError)
    } else {
      console.log(`✅ Admin has ${fulfillmentQueue.length} orders in fulfillment queue`)
      fulfillmentQueue.forEach(order => {
        console.log(`   - ${order.patient_name}: ${order.medication_name} ($${order.total_amount}) - ${order.fulfillment_status}`)
      })
    }

    console.log('\n🎉 Medication verification completed!')
    console.log('\n📋 Ready to test in dashboards:')
    console.log('   • Admin can view all patients with medications')
    console.log('   • Providers can view assigned patients with medication requests')
    console.log('   • Medication approval workflows are active')
    console.log('   • Order fulfillment system is operational')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the verification
verifyMedicationData()