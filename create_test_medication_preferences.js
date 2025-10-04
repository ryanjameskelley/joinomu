const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)
const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestMedicationPreferences() {
  try {
    console.log('🔍 Creating test medication preferences...')
    
    // First, check what tables we have and their data
    console.log('🔍 Checking available tables...')
    
    // Check patients table
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, profile_id')
      .limit(5)
    
    if (patientsError) {
      console.error('❌ Error fetching patients:', patientsError)
    } else {
      console.log('Found patients:', patients)
    }
    
    // Get medications (try different category values)
    console.log('🔍 Checking medications table...')
    const { data: allMedications, error: allMedicationsError } = await supabase
      .from('medications')
      .select('id, name, category')
      .limit(10)
    
    if (allMedicationsError) {
      console.error('❌ Error fetching all medications:', allMedicationsError)
    } else {
      console.log('Found medications:', allMedications)
    }
    
    // Get weight loss medications with correct category value
    const { data: medications, error: medicationsError } = await supabase
      .from('medications')
      .select('id, name, category')
      .eq('category', 'weight_loss')
      .limit(3)
    
    if (medicationsError) {
      console.error('❌ Error fetching medications:', medicationsError)
      return
    }
    
    console.log('Found weight loss medications:', medications)
    
    if (medications.length === 0) {
      console.log('❌ No weight loss medications found')
      return
    }
    
    // If no patients exist, we need to create one or use an existing profile
    let patient = patients && patients.length > 0 ? patients[0] : null
    
    if (!patient) {
      console.log('🔍 No patients found, checking profiles table...')
      // Try to get a profile that we can use to create a patient
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .limit(1)
      
      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError)
        return
      }
      
      if (profiles && profiles.length > 0) {
        const profile = profiles[0]
        console.log('Found profile to create patient for:', profile)
        
        // First check what columns exist in patients table
        const { data: testPatient, error: testError } = await supabase
          .from('patients')
          .select('*')
          .limit(1)
        
        if (testError) {
          console.log('Patients table columns check error:', testError)
        } else {
          console.log('Patients table structure:', testPatient.length > 0 ? Object.keys(testPatient[0]) : 'Empty table')
        }
        
        // Create a patient record with basic fields using service role
        const { data: newPatient, error: createPatientError } = await serviceSupabase
          .from('patients')
          .insert([{
            profile_id: profile.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single()
        
        if (createPatientError) {
          if (createPatientError.code === '23505') {
            // Patient already exists, try to find them
            console.log('Patient already exists for this profile, fetching...')
            const { data: existingPatient, error: fetchError } = await serviceSupabase
              .from('patients')
              .select('*')
              .eq('profile_id', profile.id)
              .single()
            
            if (fetchError) {
              console.error('❌ Error fetching existing patient:', fetchError)
              return
            }
            
            patient = existingPatient
            console.log('✅ Found existing patient:', patient)
          } else {
            console.error('❌ Error creating patient:', createPatientError)
            return
          }
        } else {
          patient = newPatient
          console.log('✅ Created patient:', patient)
        }
      } else {
        console.log('❌ No profiles found either - cannot create test data')
        return
      }
    }
    
    // Create test medication preferences for the patient
    console.log('Using patient:', patient)
    const preferencesToCreate = []
    
    // Create preferences for each medication
    for (let i = 0; i < medications.length; i++) {
      const medication = medications[i]
      const preference = {
        patient_id: patient.id,
        medication_id: medication.id,
        preferred_dosage: i === 0 ? '1mg' : i === 1 ? '2.5mg' : '5mg',
        frequency: 'Weekly',
        status: 'pending', // Use only valid status value
        refill_requested: i < 2, // First two need refills
        notes: `Test preference for ${medication.name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      preferencesToCreate.push(preference)
    }
    
    console.log('Creating preferences:', preferencesToCreate)
    
    // Insert the preferences using service role
    const { data: insertedPrefs, error: insertError } = await serviceSupabase
      .from('patient_medication_preferences')
      .insert(preferencesToCreate)
      .select()
    
    if (insertError) {
      console.error('❌ Error inserting preferences:', insertError)
      return
    }
    
    console.log('✅ Created medication preferences:', insertedPrefs)
    
    // Now check if there are provider assignments for this patient
    const { data: assignments, error: assignError } = await supabase
      .from('provider_patient_assignments')
      .select('*')
      .eq('patient_id', patient.id)
    
    if (assignError) {
      console.error('❌ Error checking assignments:', assignError)
    } else {
      console.log('Patient assignments:', assignments)
      if (assignments.length === 0) {
        console.log('⚠️ No provider assignments found - these preferences may not show in provider dashboard')
      }
    }
    
    console.log(`✅ Successfully created ${preferencesToCreate.length} test medication preferences for patient ${patient.id}`)
    console.log('These should now appear in the provider dashboard approvals tab')
    
  } catch (error) {
    console.error('❌ Error creating test preferences:', error)
  }
}

createTestMedicationPreferences().catch(console.error)