const { createClient } = require('@supabase/supabase-js')

// Use your local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixProvidersAndAssignments() {
  console.log('🔧 Fixing providers and creating assignments...\n')

  try {
    // Check what we have
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role')
      .order('created_at')

    console.log('📊 Current profiles:')
    allProfiles.forEach(profile => {
      console.log(`   ${profile.role}: ${profile.first_name} ${profile.last_name} (${profile.email})`)
    })

    // Get provider profiles
    const providerProfiles = allProfiles.filter(p => p.role === 'provider')
    console.log(`\nFound ${providerProfiles.length} provider profiles`)

    // Create missing provider records
    console.log('\n👨‍⚕️ Creating provider records...')
    for (let i = 0; i < providerProfiles.length; i++) {
      const profile = providerProfiles[i]
      const specialty = profile.first_name.includes('Emily') ? 'Endocrinology' : 'Men\'s Health'
      
      const { data: existingProvider } = await supabase
        .from('providers')
        .select('id')
        .eq('profile_id', profile.id)
        .single()

      if (!existingProvider) {
        const { error } = await supabase
          .from('providers')
          .insert({
            profile_id: profile.id,
            specialty: specialty,
            license_number: `LIC00${i + 1}`,
            phone: `555-020${i + 1}`,
            active: true
          })

        if (error) {
          console.error(`❌ Error creating provider for ${profile.first_name}:`, error.message)
        } else {
          console.log(`✅ Created provider: ${profile.first_name} ${profile.last_name} (${specialty})`)
        }
      } else {
        console.log(`✅ Provider already exists: ${profile.first_name} ${profile.last_name}`)
      }
    }

    // Now get all patients and providers for assignments
    const { data: patients } = await supabase
      .from('patients')
      .select('id, profiles(first_name, last_name, email)')
      .order('created_at')

    const { data: providers } = await supabase
      .from('providers')
      .select('id, specialty, profiles(first_name, last_name)')
      .order('created_at')

    console.log(`\n🔗 Found ${patients.length} patients and ${providers.length} providers for assignments`)

    if (patients.length >= 4 && providers.length >= 2) {
      // Create patient assignments
      console.log('\n📝 Creating patient assignments...')
      
      const assignments = [
        // Dr. Watson (Endocrinology) gets weight loss patients
        { providerId: providers[0].id, patientId: patients[0].id, treatmentType: 'weight_loss' },
        { providerId: providers[0].id, patientId: patients[1].id, treatmentType: 'weight_loss' },
        // Dr. Wilson (Men's Health) gets men's health patients  
        { providerId: providers[1].id, patientId: patients[2].id, treatmentType: 'mens_health' },
        { providerId: providers[1].id, patientId: patients[3].id, treatmentType: 'mens_health' }
      ]

      for (const assignment of assignments) {
        const { data: existing } = await supabase
          .from('patient_assignments')
          .select('id')
          .eq('provider_id', assignment.providerId)
          .eq('patient_id', assignment.patientId)
          .single()

        if (!existing) {
          const { error } = await supabase
            .from('patient_assignments')
            .insert({
              provider_id: assignment.providerId,
              patient_id: assignment.patientId,
              treatment_type: assignment.treatmentType,
              assigned_date: new Date().toISOString().split('T')[0],
              is_primary: true
            })

          if (error) {
            console.error('❌ Assignment error:', error.message)
          } else {
            console.log(`✅ Assigned patient to ${assignment.treatmentType} provider`)
          }
        } else {
          console.log(`✅ Assignment already exists`)
        }
      }

      // Create simple medication preferences for testing
      console.log('\n💊 Creating medication preferences...')
      
      const { data: medications } = await supabase
        .from('medications')
        .select('id, name, strength, category, unit_price')

      const semaglutide = medications.find(m => m.name === 'Semaglutide' && m.strength === '0.5mg')
      const testosterone = medications.find(m => m.name === 'Testosterone Cypionate')

      if (semaglutide && testosterone) {
        // Create a simple preference for patient 1 (weight loss)
        const { data: existingPref1 } = await supabase
          .from('patient_medication_preferences')
          .select('id')
          .eq('patient_id', patients[0].id)
          .single()

        if (!existingPref1) {
          const { data: pref1 } = await supabase
            .from('patient_medication_preferences')
            .insert({
              patient_id: patients[0].id,
              medication_id: semaglutide.id,
              preferred_dosage: '0.5mg',
              frequency: 'weekly',
              notes: 'Starting with lower dose for weight management',
              status: 'pending'
            })
            .select()
            .single()

          if (pref1) {
            await supabase
              .from('medication_approvals')
              .insert({
                preference_id: pref1.id,
                provider_id: providers[0].id,
                status: 'approved',
                approved_dosage: '0.5mg',
                approved_frequency: 'weekly',
                provider_notes: 'Approved for weight management program',
                approval_date: new Date().toISOString()
              })
            console.log('✅ Created Semaglutide preference and approval')
          }
        }

        // Create a pending preference for patient 3 (men's health)
        const { data: existingPref3 } = await supabase
          .from('patient_medication_preferences')
          .select('id')
          .eq('patient_id', patients[2].id)
          .single()

        if (!existingPref3) {
          const { data: pref3 } = await supabase
            .from('patient_medication_preferences')
            .insert({
              patient_id: patients[2].id,
              medication_id: testosterone.id,
              preferred_dosage: '200mg',
              frequency: 'bi-weekly',
              notes: 'Testosterone replacement therapy',
              status: 'pending'
            })
            .select()
            .single()

          if (pref3) {
            await supabase
              .from('medication_approvals')
              .insert({
                preference_id: pref3.id,
                provider_id: providers[1].id,
                status: 'needs_review',
                provider_notes: 'Awaiting additional consultation'
              })
            console.log('✅ Created Testosterone preference (pending approval)')
          }
        }
      }

      console.log('\n🎉 Setup completed successfully!')
      console.log('\n📋 You can now login and test:')
      console.log('• ADMIN: admin@test.com / password123')
      console.log('• PROVIDER: provider1@test.com / password123 (Dr. Watson - Endocrinology)')
      console.log('• PROVIDER: provider2@test.com / password123 (Dr. Wilson - Men\'s Health)')
      console.log('• PATIENT: patient1@test.com / password123 (Sarah Johnson)')
      console.log('\n✅ Check the Patients page in admin/provider dashboards!')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixProvidersAndAssignments()