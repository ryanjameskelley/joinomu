const { createClient } = require('@supabase/supabase-js')

// Use your local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function simpleAssignMedications() {
  console.log('🏥 Assigning medications to existing patients...\n')

  try {
    // Get existing patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select(`
        id,
        profiles (first_name, last_name)
      `)
      .limit(4)

    if (patientsError) {
      console.error('❌ Error fetching patients:', patientsError)
      return
    }

    console.log(`Found ${patients.length} existing patients`)

    // Get existing providers
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('id, specialty')
      .limit(3)

    if (providersError) {
      console.error('❌ Error fetching providers:', providersError)
      return
    }

    console.log(`Found ${providers.length} existing providers`)

    // Get medications
    const { data: medications, error: medicationsError } = await supabase
      .from('medications')
      .select('id, name, strength, category, unit_price')

    if (medicationsError) {
      console.error('❌ Error fetching medications:', medicationsError)
      return
    }

    console.log(`Found ${medications.length} medications`)

    const semaglutide = medications.find(m => m.name === 'Semaglutide' && m.strength === '0.5mg')
    const wegovy = medications.find(m => m.name === 'Semaglutide' && m.strength === '1.0mg')
    const testosterone = medications.find(m => m.name === 'Testosterone Cypionate')
    const sildenafil = medications.find(m => m.name === 'Sildenafil')

    if (!semaglutide || !wegovy || !testosterone || !sildenafil) {
      console.error('❌ Could not find required medications')
      return
    }

    // Assign medications to patients
    if (patients.length >= 4 && providers.length >= 1) {
      const provider_id = providers[0].id

      console.log('\n💊 Creating medication workflows...')

      // Patient 1 - Semaglutide (Complete workflow)
      console.log('1. Creating Semaglutide workflow...')
      const { data: pref1, error: pref1Error } = await supabase
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

      if (pref1Error) {
        console.error('❌ Error creating preference 1:', pref1Error)
      } else {
        console.log('✅ Created medication preference for', patients[0].profiles.first_name)

        // Approve it
        const { data: approval1, error: approval1Error } = await supabase
          .from('medication_approvals')
          .insert({
            preference_id: pref1.id,
            provider_id: provider_id,
            status: 'approved',
            approved_dosage: '0.5mg',
            approved_frequency: 'weekly',
            provider_notes: 'Approved for weight management program',
            approval_date: new Date().toISOString()
          })
          .select()
          .single()

        if (approval1Error) {
          console.error('❌ Error creating approval 1:', approval1Error)
        } else {
          console.log('✅ Created medication approval')

          // Create order
          const { error: order1Error } = await supabase
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

          if (order1Error) {
            console.error('❌ Error creating order 1:', order1Error)
          } else {
            console.log('✅ Created medication order')
          }
        }
      }

      // Patient 2 - Wegovy (Complete workflow)
      if (patients.length >= 2) {
        console.log('\n2. Creating Wegovy workflow...')
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
              provider_id: provider_id,
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
            console.log('✅ Created Wegovy workflow for', patients[1].profiles.first_name)
          }
        }
      }

      // Patient 3 - Testosterone (Complete with tracking)
      if (patients.length >= 3) {
        console.log('\n3. Creating Testosterone workflow...')
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
              provider_id: provider_id,
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
            console.log('✅ Created Testosterone workflow for', patients[2].profiles.first_name)
          }
        }
      }

      // Patient 4 - Sildenafil (Pending approval)
      if (patients.length >= 4) {
        console.log('\n4. Creating Sildenafil workflow (pending)...')
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
              provider_id: provider_id,
              status: 'needs_review',
              provider_notes: 'Awaiting additional consultation'
            })
          console.log('✅ Created Sildenafil workflow (pending) for', patients[3].profiles.first_name)
        }
      }

      console.log('\n🎉 Successfully assigned medications to patients!')
      console.log('\n📋 Summary:')
      console.log('- Patient 1: Semaglutide (Approved → Paid → Processing)')
      console.log('- Patient 2: Wegovy (Approved → Paid → Shipped)')
      console.log('- Patient 3: Testosterone (Approved → Paid → Shipped with tracking)')
      console.log('- Patient 4: Sildenafil (Pending approval)')

    } else {
      console.log('❌ Not enough patients or providers found')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the assignment
simpleAssignMedications()