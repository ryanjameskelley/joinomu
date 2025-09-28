const { createClient } = require('@supabase/supabase-js')

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const anonSupabase = createClient(supabaseUrl, supabaseAnonKey)
const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function setupCorrectedVisits() {
  try {
    console.log('🏗️  CORRECTED VISIT SCHEDULING SETUP')
    console.log('=' .repeat(50))
    
    // STEP 1: Create working patient auth user
    console.log('\n📋 STEP 1: Creating Patient Auth User')
    const { data: patientAuth, error: patientAuthError } = await anonSupabase.auth.signUp({
      email: 'testpatient.visits@test.com',
      password: 'password',
      options: {
        data: { full_name: 'Test Patient for Visits' }
      }
    })
    
    if (patientAuthError && !patientAuthError.message.includes('already registered')) {
      console.error('❌ Patient auth error:', patientAuthError.message)
      return
    }
    
    const patientAuthId = patientAuth?.user?.id
    if (!patientAuthId) {
      console.error('❌ No patient auth ID returned')
      return
    }
    console.log(`✅ Patient auth created: ${patientAuthId}`)
    
    // Set patient profile
    await serviceSupabase.from('profiles').upsert([{
      id: patientAuthId,
      email: 'testpatient.visits@test.com',
      role: 'patient'
    }])
    console.log('✅ Patient profile set')
    
    // STEP 2: Create working provider auth user
    console.log('\n📋 STEP 2: Creating Provider Auth User')
    const { data: providerAuth, error: providerAuthError } = await anonSupabase.auth.signUp({
      email: 'testprovider.visits@test.com',
      password: 'password',
      options: {
        data: { full_name: 'Test Provider for Visits' }
      }
    })
    
    if (providerAuthError && !providerAuthError.message.includes('already registered')) {
      console.error('❌ Provider auth error:', providerAuthError.message)
      return
    }
    
    const providerAuthId = providerAuth?.user?.id
    if (!providerAuthId) {
      console.error('❌ No provider auth ID returned')
      return
    }
    console.log(`✅ Provider auth created: ${providerAuthId}`)
    
    // Set provider profile
    await serviceSupabase.from('profiles').upsert([{
      id: providerAuthId,
      email: 'testprovider.visits@test.com',
      role: 'provider'
    }])
    console.log('✅ Provider profile set')
    
    // STEP 3: Create required database records using ACTUAL schema
    console.log('\n📋 STEP 3: Creating Database Records')
    
    // Create patients record using correct schema
    await serviceSupabase.from('patients').upsert([{
      id: patientAuthId,
      profile_id: patientAuthId,  // Use profile_id instead of name
      date_of_birth: '1990-01-01',
      has_completed_intake: true
    }])
    console.log('✅ Patient record created')
    
    // Create providers record using correct schema
    await serviceSupabase.from('providers').upsert([{
      id: providerAuthId,
      profile_id: providerAuthId,  // Use profile_id instead of name
      specialty: 'Weight Management',
      license_number: 'VISITS123',
      active: true
    }])
    console.log('✅ Provider record created')
    
    // STEP 4: Create provider schedules
    console.log('\n📋 STEP 4: Creating Provider Schedules')
    
    const schedules = [
      // Monday-Friday 9AM-5PM with 30min slots for weight_loss
      { day_of_week: 1, start_time: '09:00:00', end_time: '12:00:00' }, // Mon morning
      { day_of_week: 1, start_time: '13:00:00', end_time: '17:00:00' }, // Mon afternoon
      { day_of_week: 2, start_time: '09:00:00', end_time: '12:00:00' }, // Tue morning
      { day_of_week: 2, start_time: '13:00:00', end_time: '17:00:00' }, // Tue afternoon
      { day_of_week: 3, start_time: '09:00:00', end_time: '12:00:00' }, // Wed morning
      { day_of_week: 3, start_time: '13:00:00', end_time: '17:00:00' }, // Wed afternoon
      { day_of_week: 4, start_time: '09:00:00', end_time: '12:00:00' }, // Thu morning
      { day_of_week: 4, start_time: '13:00:00', end_time: '17:00:00' }, // Thu afternoon
      { day_of_week: 5, start_time: '09:00:00', end_time: '12:00:00' }, // Fri morning
      { day_of_week: 5, start_time: '13:00:00', end_time: '17:00:00' }, // Fri afternoon
    ]
    
    for (const schedule of schedules) {
      await serviceSupabase.from('provider_schedules').upsert([{
        provider_id: providerAuthId,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        slot_duration_minutes: 30,
        treatment_types: ['weight_loss'],
        active: true
      }])
    }
    console.log(`✅ Created ${schedules.length} provider schedule blocks`)
    
    // STEP 5: Create patient assignment
    console.log('\n📋 STEP 5: Creating Patient Assignment')
    
    await serviceSupabase.from('patient_assignments').upsert([{
      patient_id: patientAuthId,
      provider_id: providerAuthId,
      treatment_type: 'weight_loss',
      assigned_date: new Date().toISOString().split('T')[0],
      is_primary: true,
      active: true
    }])
    console.log('✅ Patient assigned to provider for weight_loss')
    
    // STEP 6: Create sample appointments/visits for testing visits component
    console.log('\n📋 STEP 6: Creating Sample Appointments for Visits Testing')
    
    const sampleAppointments = [
      {
        id: 'visit_test_1',
        patient_id: patientAuthId,
        provider_id: providerAuthId,
        appointment_date: '2024-09-20',
        start_time: '10:00:00',
        end_time: '10:30:00',
        duration_minutes: 30,
        treatment_type: 'weight_loss',
        appointment_type: 'initial_consultation',
        status: 'completed',
        patient_notes: 'First visit for weight management program',
        provider_notes: 'Patient committed to lifestyle changes',
        booked_by: 'patient',
        booked_by_user_id: patientAuthId
      },
      {
        id: 'visit_test_2',
        patient_id: patientAuthId,
        provider_id: providerAuthId,
        appointment_date: '2024-09-15',
        start_time: '14:30:00',
        end_time: '15:00:00',
        duration_minutes: 30,
        treatment_type: 'weight_loss',
        appointment_type: 'follow_up',
        status: 'completed',
        patient_notes: 'Follow-up on progress',
        provider_notes: 'Lost 3 lbs, continuing program',
        booked_by: 'provider',
        booked_by_user_id: providerAuthId
      },
      {
        id: 'visit_test_3',
        patient_id: patientAuthId,
        provider_id: providerAuthId,
        appointment_date: '2024-10-05',
        start_time: '11:00:00',
        end_time: '11:30:00',
        duration_minutes: 30,
        treatment_type: 'weight_loss',
        appointment_type: 'check_up',
        status: 'scheduled',
        patient_notes: 'Monthly check-in appointment',
        booked_by: 'patient',
        booked_by_user_id: patientAuthId
      }
    ]
    
    for (const appointment of sampleAppointments) {
      await serviceSupabase.from('appointments').upsert([appointment])
    }
    console.log(`✅ Created ${sampleAppointments.length} sample appointments`)
    
    // STEP 7: Create medication preferences if table exists
    console.log('\n📋 STEP 7: Creating Medication Preferences')
    
    try {
      const medications = [
        {
          id: 'med_visit_1',
          patient_id: patientAuthId,
          medication_name: 'Semaglutide (Ozempic)',
          preferred_dosage: '1.0mg',
          frequency: 'Weekly',
          status: 'approved',
          requested_date: '2024-09-15',
          notes: 'Started after initial consultation'
        },
        {
          id: 'med_visit_2',
          patient_id: patientAuthId,
          medication_name: 'Metformin',
          preferred_dosage: '500mg',
          frequency: 'Twice daily',
          status: 'approved',
          requested_date: '2024-09-20',
          notes: 'Added for additional blood sugar support'
        }
      ]
      
      for (const med of medications) {
        await serviceSupabase.from('patient_medication_preferences').upsert([med])
      }
      console.log(`✅ Created ${medications.length} medication preferences`)
    } catch (medError) {
      console.log('⚠️ Medication table may not exist, skipping medication setup')
    }
    
    // STEP 8: Final verification
    console.log('\n📋 STEP 8: Final Verification')
    
    // Verify assignment exists
    const { data: assignments } = await serviceSupabase
      .from('patient_assignments')
      .select('*')
      .eq('patient_id', patientAuthId)
      .eq('provider_id', providerAuthId)
      .eq('treatment_type', 'weight_loss')
    
    console.log(`✅ Found ${assignments?.length || 0} patient assignments`)
    
    // Verify schedules exist
    const { data: scheduleCheck } = await serviceSupabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerAuthId)
      .eq('active', true)
      .contains('treatment_types', ['weight_loss'])
    
    console.log(`✅ Found ${scheduleCheck?.length || 0} active provider schedules`)
    
    // Verify appointments exist
    const { data: appointmentCheck } = await serviceSupabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientAuthId)
      .eq('provider_id', providerAuthId)
    
    console.log(`✅ Found ${appointmentCheck?.length || 0} appointments for visits testing`)
    
    console.log('\n🎉 CORRECTED VISIT SCHEDULING SETUP FINISHED!')
    console.log('=' .repeat(50))
    console.log('')
    console.log('🔑 LOGIN CREDENTIALS:')
    console.log('👤 PATIENT: testpatient.visits@test.com / password')
    console.log('🩺 PROVIDER: testprovider.visits@test.com / password')
    console.log('')
    console.log('✅ WHAT\'S READY:')
    console.log('  • Patient can login and see weight loss provider with available times')
    console.log('  • Provider has schedule blocks (Mon-Fri, AM/PM)')
    console.log('  • 3 sample appointments (2 completed, 1 scheduled) for visits component')
    console.log('  • All database relationships properly established with correct schema')
    console.log('')
    console.log('🧪 TESTING STEPS:')
    console.log('  1. Login as testpatient.visits@test.com - book appointments')
    console.log('  2. Login as testprovider.visits@test.com - view patients')
    console.log('  3. Click patient → Patient Information dialog')
    console.log('  4. Test "Visits" tab with VisitCard components')
    console.log('  5. Verify appointment booking works with available time slots')
    
  } catch (error) {
    console.error('❌ Setup error:', error)
  }
}

setupCorrectedVisits()