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

async function assignProviderAndCreateOverrides() {
  try {
    const providerId = '1ca238a9-9547-41fb-851e-8eb0dcb92c82'
    
    console.log('🔍 Using test patient...')
    
    // Use the test user ID directly
    const patientId = 'fe5fee47-896d-4ac7-ba2b-d35ef4589eee'
    
    console.log('✅ Using test patient ID:', patientId)
    
    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('patient_id', patientId)
      .eq('provider_id', providerId)
      .eq('treatment_type', 'weight_loss')
      .single()
    
    if (existingAssignment) {
      console.log('✅ Assignment already exists')
    } else {
      console.log('📋 Creating patient assignment...')
      
      // Create patient assignment for weight loss
      const { error: assignmentError } = await supabase
        .from('patient_assignments')
        .insert([
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
    }
    
    console.log('⏰ Creating availability overrides...')
    
    // Create some availability overrides to block time
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
    
    const overrides = [
      {
        provider_id: providerId,
        date: tomorrow.toISOString().split('T')[0],
        start_time: '09:00:00',
        end_time: '11:00:00',
        available: false,
        reason: 'Medical conference',
        created_by: providerId
      },
      {
        provider_id: providerId,
        date: tomorrow.toISOString().split('T')[0],
        start_time: '14:30:00',
        end_time: '15:30:00',
        available: false,
        reason: 'Staff meeting',
        created_by: providerId
      },
      {
        provider_id: providerId,
        date: dayAfterTomorrow.toISOString().split('T')[0],
        start_time: '16:00:00',
        end_time: '17:00:00',
        available: false,
        reason: 'Personal appointment',
        created_by: providerId
      }
    ]
    
    for (const override of overrides) {
      // Check if override already exists
      const { data: existingOverride } = await supabase
        .from('provider_availability_overrides')
        .select('*')
        .eq('provider_id', override.provider_id)
        .eq('date', override.date)
        .eq('start_time', override.start_time)
        .single()
      
      if (existingOverride) {
        console.log(`⏰ Override already exists for ${override.date} ${override.start_time}`)
      } else {
        const { error: overrideError } = await supabase
          .from('provider_availability_overrides')
          .insert([override])
        
        if (overrideError) {
          console.error(`❌ Error creating override for ${override.date}:`, overrideError)
        } else {
          console.log(`✅ Created override: ${override.date} ${override.start_time}-${override.end_time} (${override.reason})`)
        }
      }
    }
    
    console.log('\n🎉 Setup complete!')
    console.log(`👤 Provider (${providerId}) assigned to patient1 for weight loss`)
    console.log('⏰ Availability overrides created for blocked time slots')
    console.log('\n📋 Now you can:')
    console.log('1. Login as provider@test.com / password')
    console.log('2. View patient1 in your provider dashboard')
    console.log('3. Click on patient1 to see their information dialog')
    console.log('4. Navigate to the "Visits" tab to test the visits component')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

assignProviderAndCreateOverrides()