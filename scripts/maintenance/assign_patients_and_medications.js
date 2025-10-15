const { createClient } = require('@supabase/supabase-js')

// Use your local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function assignPatientsAndMedications() {
  console.log('🔗 Assigning patients to providers and creating medication workflows...\n')

  try {
    // Get all patients, providers, and medications
    const { data: patients } = await supabase
      .from('patients')
      .select('id, profiles(first_name, last_name, email)')
      .order('created_at')

    const { data: providers } = await supabase
      .from('providers')
      .select('id, specialty, profiles(first_name, last_name)')
      .order('created_at')

    const { data: medications } = await supabase
      .from('medications')
      .select('id, name, strength, category, unit_price')

    console.log(`Found ${patients.length} patients, ${providers.length} providers, ${medications.length} medications`)

    if (patients.length >= 4 && providers.length >= 2) {
      // Assign patients to providers
      console.log('\n👨‍⚕️ Assigning patients to providers...')
      
      const assignments = [
        // Dr. Watson (Endocrinology) gets weight loss patients
        { providerId: providers[0].id, patientId: patients[0].id, treatmentType: 'weight_loss' },
        { providerId: providers[0].id, patientId: patients[1].id, treatmentType: 'weight_loss' },
        // Dr. Wilson (Men's Health) gets men's health patients  
        { providerId: providers[1].id, patientId: patients[2].id, treatmentType: 'mens_health' },
        { providerId: providers[1].id, patientId: patients[3].id, treatmentType: 'mens_health' }
      ]

      for (const assignment of assignments) {
        const { error } = await supabase
          .from('patient_assignments')
          .insert({
            provider_id: assignment.providerId,
            patient_id: assignment.patientId,
            treatment_type: assignment.treatmentType,
            assigned_date: new Date().toISOString().split('T')[0],
            is_primary: true
          })

        if (error && !error.message.includes('duplicate')) {
          console.error('❌ Assignment error:', error.message)
        } else {
          console.log(`✅ Assigned patient to ${assignment.treatmentType} provider`)
        }
      }

      // Create medication workflows
      console.log('\n💊 Creating medication workflows...')

      const semaglutide = medications.find(m => m.name === 'Semaglutide' && m.strength === '0.5mg')
      const wegovy = medications.find(m => m.name === 'Semaglutide' && m.strength === '1.0mg')
      const testosterone = medications.find(m => m.name === 'Testosterone Cypionate')
      const sildenafil = medications.find(m => m.name === 'Sildenafil')

      if (semaglutide && wegovy && testosterone && sildenafil) {
        // Patient 1 - Semaglutide (Complete workflow)
        console.log('Creating Semaglutide workflow...')
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
          const { data: approval1 } = await supabase
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
            .select()
            .single()

          if (approval1) {
            await supabase
              .from('medication_orders')
              .insert({
                approval_id: approval1.id,
                patient_id: patients[0].id,
                medication_id: semaglutide.id,
                quantity: 1,
                unit_price: semaglutide.unit_price,
                total_amount: semaglutide.unit_price,
                payment_status: 'paid',
                fulfillment_status: 'processing'
              })
            console.log('✅ Created Semaglutide workflow (approved → paid → processing)')
          }
        }

        // Patient 2 - Wegovy (Complete workflow)
        console.log('Creating Wegovy workflow...')
        const { data: pref2 } = await supabase
          .from('patient_medication_preferences')
          .insert({
            patient_id: patients[1].id,
            medication_id: wegovy.id,
            preferred_dosage: '1.0mg',
            frequency: 'weekly',
            notes: 'Higher dose for aggressive weight loss',
            status: 'pending'
          })
          .select()
          .single()

        if (pref2) {
          const { data: approval2 } = await supabase
            .from('medication_approvals')
            .insert({
              preference_id: pref2.id,
              provider_id: providers[0].id,
              status: 'approved',
              approved_dosage: '1.0mg',
              approved_frequency: 'weekly',
              provider_notes: 'Patient suitable for higher dose',
              approval_date: new Date().toISOString()
            })
            .select()
            .single()

          if (approval2) {
            await supabase
              .from('medication_orders')
              .insert({
                approval_id: approval2.id,
                patient_id: patients[1].id,
                medication_id: wegovy.id,
                quantity: 1,
                unit_price: wegovy.unit_price,
                total_amount: wegovy.unit_price,
                payment_status: 'paid',
                fulfillment_status: 'shipped'
              })
            console.log('✅ Created Wegovy workflow (approved → paid → shipped)')
          }
        }

        // Patient 3 - Testosterone (Complete with tracking)
        console.log('Creating Testosterone workflow...')
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
          const { data: approval3 } = await supabase
            .from('medication_approvals')
            .insert({
              preference_id: pref3.id,
              provider_id: providers[1].id,
              status: 'approved',
              approved_dosage: '200mg',
              approved_frequency: 'bi-weekly',
              provider_notes: 'TRT approved after lab review',
              approval_date: new Date().toISOString()
            })
            .select()
            .single()

          if (approval3) {
            await supabase
              .from('medication_orders')
              .insert({
                approval_id: approval3.id,
                patient_id: patients[2].id,
                medication_id: testosterone.id,
                quantity: 1,
                unit_price: testosterone.unit_price,
                total_amount: testosterone.unit_price,
                payment_status: 'paid',
                fulfillment_status: 'shipped',
                tracking_number: 'TRK123456789'
              })
            console.log('✅ Created Testosterone workflow (approved → paid → shipped with tracking)')
          }
        }

        // Patient 4 - Sildenafil (Pending approval)
        console.log('Creating Sildenafil workflow (pending)...')
        const { data: pref4 } = await supabase
          .from('patient_medication_preferences')
          .insert({
            patient_id: patients[3].id,
            medication_id: sildenafil.id,
            preferred_dosage: '50mg',
            frequency: 'as_needed',
            notes: 'ED treatment request',
            status: 'pending'
          })
          .select()
          .single()

        if (pref4) {
          await supabase
            .from('medication_approvals')
            .insert({
              preference_id: pref4.id,
              provider_id: providers[1].id,
              status: 'needs_review',
              provider_notes: 'Awaiting additional consultation'
            })
          console.log('✅ Created Sildenafil workflow (pending approval)')
        }

        console.log('\n🎉 Successfully created complete medication workflows!')
        console.log('\n📋 Test Summary:')
        console.log('✅ 4 patients assigned to 2 providers')
        console.log('✅ 4 medication workflows with different states:')
        console.log('   • Sarah Johnson: Semaglutide (Approved → Paid → Processing)')
        console.log('   • Michael Roberts: Wegovy (Approved → Paid → Shipped)')
        console.log('   • Jennifer Martinez: Testosterone (Approved → Paid → Shipped with tracking)')
        console.log('   • David Anderson: Sildenafil (Pending approval)')
        console.log('\n🚀 Ready to test in admin and provider dashboards!')

      } else {
        console.log('❌ Missing required medications')
      }
    } else {
      console.log('❌ Insufficient patients or providers')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

assignPatientsAndMedications()