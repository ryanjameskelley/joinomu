const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUsersAndAssignments() {
  try {
    console.log('🔄 Creating test users...')

    // Create patient1@test.com
    const { data: patient1Auth, error: patient1AuthError } = await supabase.auth.admin.createUser({
      email: 'patient1@test.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        role: 'patient',
        first_name: 'John',
        last_name: 'Smith',
        date_of_birth: '1985-06-15',
        phone: '555-0123'
      }
    })

    if (patient1AuthError) {
      console.error('❌ Error creating patient1:', patient1AuthError)
      return
    }

    console.log('✅ Created patient1@test.com:', patient1Auth.user.id)

    // Create provider1@test.com
    const { data: provider1Auth, error: provider1AuthError } = await supabase.auth.admin.createUser({
      email: 'provider1@test.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        role: 'provider',
        first_name: 'Dr. Sarah',
        last_name: 'Wilson',
        specialty: 'Family Medicine',
        license_number: 'MD123456'
      }
    })

    if (provider1AuthError) {
      console.error('❌ Error creating provider1:', provider1AuthError)
      return
    }

    console.log('✅ Created provider1@test.com:', provider1Auth.user.id)

    // Wait a moment for triggers to process
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Get patient and provider IDs from their respective tables
    const { data: patientData } = await supabase
      .from('patients')
      .select('id')
      .eq('profile_id', patient1Auth.user.id)
      .single()

    const { data: providerData } = await supabase
      .from('providers')
      .select('id')
      .eq('profile_id', provider1Auth.user.id)
      .single()

    if (!patientData || !providerData) {
      console.error('❌ Could not find patient or provider records')
      return
    }

    console.log('✅ Found patient ID:', patientData.id)
    console.log('✅ Found provider ID:', providerData.id)

    // Create patient assignment
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('patient_assignments')
      .insert({
        patient_id: patientData.id,
        provider_id: providerData.id,
        treatment_type: 'weight_management',
        is_primary: true,
        assigned_date: new Date().toISOString()
      })
      .select()

    if (assignmentError) {
      console.error('❌ Error creating assignment:', assignmentError)
      return
    }

    console.log('✅ Created patient assignment:', assignmentData)

    // Verify the assignment works with the provider query
    const { data: assignedPatients, error: queryError } = await supabase.rpc('get_assigned_patients_for_provider', {
      provider_profile_id: provider1Auth.user.id
    })

    if (queryError) {
      console.error('❌ Error querying assigned patients:', queryError)
      return
    }

    console.log('✅ Provider assigned patients query result:', assignedPatients)

    if (assignedPatients && assignedPatients.length > 0) {
      console.log('🎉 SUCCESS: John Smith is assigned to provider1@test.com')
      console.log('📝 Patient details:', {
        name: `${assignedPatients[0].first_name} ${assignedPatients[0].last_name}`,
        email: assignedPatients[0].email,
        treatment_type: assignedPatients[0].treatment_type
      })
    } else {
      console.log('❌ No patients found for provider')
    }

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

createTestUsersAndAssignments()