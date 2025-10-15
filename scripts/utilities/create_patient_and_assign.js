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

async function createPatientAndAssign() {
  try {
    const providerId = '1ca238a9-9547-41fb-851e-8eb0dcb92c82'
    const patientId = 'fe5fee47-896d-4ac7-ba2b-d35ef4589eee'
    
    console.log('👤 Creating patient record...')
    
    // Create patient record
    const { error: patientError } = await supabase
      .from('patients')
      .upsert([
        {
          id: patientId,
          name: 'Test Patient',
          date_of_birth: '1990-01-01',
          phone: '+1-555-0123'
        }
      ])
    
    if (patientError) {
      console.error('❌ Error creating patient:', patientError)
    } else {
      console.log('✅ Patient record created/updated')
    }
    
    console.log('📋 Creating patient assignment...')
    
    // Create patient assignment
    const { error: assignmentError } = await supabase
      .from('patient_assignments')
      .upsert([
        {
          patient_id: patientId,
          provider_id: providerId,
          treatment_type: 'weight_loss',
          assigned_date: new Date().toISOString().split('T')[0],
          is_primary: true
        }
      ])
    
    if (assignmentError) {
      console.error('❌ Error creating assignment:', assignmentError)
    } else {
      console.log('✅ Patient assignment created')
    }
    
    console.log('⏰ Creating availability overrides...')
    
    // Create simple overrides without created_by column
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const overrides = [
      {
        provider_id: providerId,
        date: tomorrow.toISOString().split('T')[0],
        start_time: '09:00:00',
        end_time: '11:00:00',
        available: false,
        reason: 'Medical conference'
      },
      {
        provider_id: providerId,
        date: tomorrow.toISOString().split('T')[0],
        start_time: '14:30:00',
        end_time: '15:30:00',
        available: false,
        reason: 'Staff meeting'
      }
    ]
    
    for (const override of overrides) {
      const { error: overrideError } = await supabase
        .from('provider_availability_overrides')
        .upsert([override])
      
      if (overrideError) {
        console.error(`❌ Error creating override:`, overrideError)
      } else {
        console.log(`✅ Created override: ${override.date} ${override.start_time}-${override.end_time}`)
      }
    }
    
    console.log('\n🎉 Setup complete!')
    console.log('📧 Login as: provider@test.com / password')
    console.log('👤 View test patient in provider dashboard')
    console.log('🩺 Test the visits component in patient information dialog')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createPatientAndAssign()