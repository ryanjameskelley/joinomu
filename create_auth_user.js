const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createNewAuthUser() {
  try {
    console.log('🚀 Creating new auth user...')
    
    // Create a fresh auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'testpatient@example.com',
      password: 'password123',
      user_metadata: {
        role: 'patient',
        first_name: 'Test',
        last_name: 'Patient'
      },
      email_confirm: true
    })
    
    if (authError) {
      console.error('❌ Auth user error:', authError)
      return
    }
    
    console.log('✅ Auth user created:', authUser.user.id, authUser.user.email)
    
    // Create profile for this user
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authUser.user.id,
      email: authUser.user.email,
      first_name: 'Test',
      last_name: 'Patient',
      role: 'patient'
    })
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
      return
    }
    
    console.log('✅ Profile created')
    
    // Create patient record
    const { data: patient, error: patientError } = await supabase.from('patients').insert({
      profile_id: authUser.user.id,
      date_of_birth: '1990-01-01',
      phone: '555-0123',
      has_completed_intake: true
    }).select().single()
    
    if (patientError) {
      console.error('❌ Patient error:', patientError)
      return
    }
    
    console.log('✅ Patient record created:', patient.id)
    
    // Get existing providers
    const { data: providers } = await supabase
      .from('providers')
      .select('id, specialty')
    
    // Create patient assignments for this new patient
    console.log('🔗 Creating patient assignments...')
    
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i]
      const treatmentType = provider.specialty === 'Weight Loss' ? 'weight_loss' : 'mens_health'
      
      await supabase.from('patient_assignments').insert({
        patient_id: patient.id,
        provider_id: provider.id,
        treatment_type: treatmentType,
        is_primary: i === 0,
        assigned_date: new Date().toISOString(),
        active: true
      })
      
      console.log(`✅ Assigned ${provider.specialty} provider`)
    }
    
    console.log('')
    console.log('🎉 Complete setup finished!')
    console.log('📋 Login credentials:')
    console.log(`   Email: ${authUser.user.email}`)
    console.log('   Password: password123')
    console.log(`   User ID: ${authUser.user.id}`)
    console.log('')
    console.log('🚀 Ready to test visits booking!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

createNewAuthUser()