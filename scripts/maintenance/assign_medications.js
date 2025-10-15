const { createClient } = require('@supabase/supabase-js')

// Use your local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function assignMedicationsToPatients() {
  console.log('🏥 Creating sample patients and assigning medications...\n')

  try {
    // Step 1: Create profiles
    console.log('👥 1. Creating user profiles...')
    const profiles = [
      // Patients
      { id: '11111111-1111-1111-1111-111111111111', first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@example.com', role: 'patient' },
      { id: '22222222-2222-2222-2222-222222222222', first_name: 'Michael', last_name: 'Roberts', email: 'michael@example.com', role: 'patient' },
      { id: '33333333-3333-3333-3333-333333333333', first_name: 'Jennifer', last_name: 'Martinez', email: 'jennifer@example.com', role: 'patient' },
      { id: '44444444-4444-4444-4444-444444444444', first_name: 'David', last_name: 'Anderson', email: 'david@example.com', role: 'patient' },
      // Admin
      { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', first_name: 'Admin', last_name: 'User', email: 'admin@example.com', role: 'admin' },
      // Providers
      { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', first_name: 'Dr. Emily', last_name: 'Watson', email: 'dr.watson@example.com', role: 'provider' },
      { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', first_name: 'Dr. James', last_name: 'Wilson', email: 'dr.wilson@example.com', role: 'provider' }
    ]

    for (const profile of profiles) {
      const { error } = await supabase
        .from('profiles')
        .upsert(profile)
      
      if (error && !error.message.includes('duplicate key')) {
        console.error(`❌ Error creating profile ${profile.first_name}:`, error)
      } else {
        console.log(`✅ Created profile: ${profile.first_name} ${profile.last_name}`)
      }
    }

    // Step 2: Create patients
    console.log('\n🏥 2. Creating patient records...')
    const patients = [
      { profile_id: '11111111-1111-1111-1111-111111111111', phone: '555-0101', has_completed_intake: true },
      { profile_id: '22222222-2222-2222-2222-222222222222', phone: '555-0102', has_completed_intake: true },
      { profile_id: '33333333-3333-3333-3333-333333333333', phone: '555-0103', has_completed_intake: true },
      { profile_id: '44444444-4444-4444-4444-444444444444', phone: '555-0104', has_completed_intake: true }
    ]

    for (const patient of patients) {
      const { data, error } = await supabase
        .from('patients')
        .upsert(patient)
        .select()
      
      if (error && !error.message.includes('duplicate key')) {
        console.error('❌ Error creating patient:', error)
      } else {
        console.log(`✅ Created patient for profile: ${patient.profile_id}`)
      }
    }

    // Step 3: Create admin
    console.log('\n👨‍💼 3. Creating admin record...')
    const { error: adminError } = await supabase
      .from('admins')
      .upsert({
        profile_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        permissions: ['all']
      })

    if (adminError && !adminError.message.includes('duplicate key')) {
      console.error('❌ Error creating admin:', adminError)
    } else {
      console.log('✅ Created admin record')
    }

    // Step 4: Create providers
    console.log('\n👨‍⚕️ 4. Creating provider records...')
    const providers = [
      { profile_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', specialty: 'Endocrinology', license_number: 'LIC001', phone: '555-0201', active: true },
      { profile_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', specialty: 'Men\'s Health', license_number: 'LIC002', phone: '555-0202', active: true }
    ]

    for (const provider of providers) {
      const { error } = await supabase
        .from('providers')
        .upsert(provider)
      
      if (error && !error.message.includes('duplicate key')) {
        console.error('❌ Error creating provider:', error)
      } else {
        console.log(`✅ Created provider: ${provider.specialty}`)
      }
    }

    // Step 5: Assign patients to providers
    console.log('\n🔗 5. Assigning patients to providers...')
    const assignments = [
      // Dr. Watson gets weight loss patients
      { provider_id: 'prov1111-1111-1111-1111-111111111111', patient_id: 'p1111111-1111-1111-1111-111111111111', treatment_type: 'weight_loss', assigned_date: new Date().toISOString().split('T')[0], is_primary: true },
      { provider_id: 'prov1111-1111-1111-1111-111111111111', patient_id: 'p2222222-2222-2222-2222-222222222222', treatment_type: 'weight_loss', assigned_date: new Date().toISOString().split('T')[0], is_primary: true },
      // Dr. Wilson gets men's health patients
      { provider_id: 'prov2222-2222-2222-2222-222222222222', patient_id: 'p3333333-3333-3333-3333-333333333333', treatment_type: 'mens_health', assigned_date: new Date().toISOString().split('T')[0], is_primary: true },
      { provider_id: 'prov2222-2222-2222-2222-222222222222', patient_id: 'p4444444-4444-4444-4444-444444444444', treatment_type: 'mens_health', assigned_date: new Date().toISOString().split('T')[0], is_primary: true }
    ]

    for (const assignment of assignments) {
      const { error } = await supabase
        .from('patient_assignments')
        .upsert(assignment)
      
      if (error && !error.message.includes('duplicate key')) {
        console.error('❌ Error creating assignment:', error)
      } else {
        console.log(`✅ Assigned patient ${assignment.patient_id} to provider ${assignment.provider_id}`)
      }
    }

    // Step 6: Get medication IDs
    console.log('\n💊 6. Getting medication IDs...')
    const { data: medications, error: medError } = await supabase
      .from('medications')
      .select('id, name, strength, category')

    if (medError) {
      console.error('❌ Error fetching medications:', medError)
      return
    }

    const semaglutide = medications.find(m => m.name === 'Semaglutide' && m.strength === '0.5mg')
    const wegovy = medications.find(m => m.name === 'Semaglutide' && m.strength === '1.0mg')
    const testosterone = medications.find(m => m.name === 'Testosterone Cypionate')
    const sildenafil = medications.find(m => m.name === 'Sildenafil')

    console.log(`Found medications: ${medications.length} total`)

    // Step 7: Create medication workflow for each patient
    console.log('\n🎯 7. Creating medication workflows...')

    // Sarah Johnson - Semaglutide (Complete workflow)
    console.log('👩 Sarah Johnson - Semaglutide workflow...')
    const { data: sarahPref, error: sarahPrefError } = await supabase
      .from('patient_medication_preferences')
      .insert({
        patient_id: 'p1111111-1111-1111-1111-111111111111',
        medication_id: semaglutide.id,
        preferred_dosage: '0.5mg',
        frequency: 'weekly',
        notes: 'Starting with lower dose for weight management',
        status: 'pending'
      })
      .select()
      .single()

    if (sarahPrefError) {
      console.error('❌ Sarah preference error:', sarahPrefError)
    } else {
      console.log('✅ Created Sarah\'s medication preference')

      // Approve it
      const { data: sarahApproval, error: sarahApprovalError } = await supabase
        .from('medication_approvals')
        .insert({
          preference_id: sarahPref.id,
          provider_id: 'prov1111-1111-1111-1111-111111111111',
          status: 'approved',
          approved_dosage: '0.5mg',
          approved_frequency: 'weekly',
          provider_notes: 'Approved for weight management program',
          approval_date: new Date().toISOString()
        })
        .select()
        .single()

      if (sarahApprovalError) {
        console.error('❌ Sarah approval error:', sarahApprovalError)
      } else {
        console.log('✅ Created Sarah\'s medication approval')

        // Create order
        const { error: sarahOrderError } = await supabase
          .from('medication_orders')
          .insert({
            approval_id: sarahApproval.id,
            patient_id: 'p1111111-1111-1111-1111-111111111111',
            medication_id: semaglutide.id,
            quantity: 1,
            unit_price: 899.99,
            total_amount: 899.99,
            payment_status: 'paid',
            fulfillment_status: 'processing'
          })

        if (sarahOrderError) {
          console.error('❌ Sarah order error:', sarahOrderError)
        } else {
          console.log('✅ Created Sarah\'s medication order')
        }
      }
    }

    // Michael Roberts - Wegovy (Complete workflow)
    console.log('👨 Michael Roberts - Wegovy workflow...')
    const { data: michaelPref, error: michaelPrefError } = await supabase
      .from('patient_medication_preferences')
      .insert({
        patient_id: 'p2222222-2222-2222-2222-222222222222',
        medication_id: wegovy.id,
        preferred_dosage: '1.0mg',
        frequency: 'weekly',
        notes: 'Higher dose for aggressive weight loss',
        status: 'pending'
      })
      .select()
      .single()

    if (michaelPrefError) {
      console.error('❌ Michael preference error:', michaelPrefError)
    } else {
      console.log('✅ Created Michael\'s medication preference')

      // Approve and create order...
      const { data: michaelApproval } = await supabase
        .from('medication_approvals')
        .insert({
          preference_id: michaelPref.id,
          provider_id: 'prov1111-1111-1111-1111-111111111111',
          status: 'approved',
          approved_dosage: '1.0mg',
          approved_frequency: 'weekly',
          provider_notes: 'Patient suitable for higher dose',
          approval_date: new Date().toISOString()
        })
        .select()
        .single()

      if (michaelApproval) {
        await supabase
          .from('medication_orders')
          .insert({
            approval_id: michaelApproval.id,
            patient_id: 'p2222222-2222-2222-2222-222222222222',
            medication_id: wegovy.id,
            quantity: 1,
            unit_price: 1299.99,
            total_amount: 1299.99,
            payment_status: 'paid',
            fulfillment_status: 'shipped'
          })
        console.log('✅ Created Michael\'s complete workflow')
      }
    }

    // Jennifer Martinez - Testosterone (Complete with tracking)
    console.log('👩 Jennifer Martinez - Testosterone workflow...')
    const { data: jenniferPref } = await supabase
      .from('patient_medication_preferences')
      .insert({
        patient_id: 'p3333333-3333-3333-3333-333333333333',
        medication_id: testosterone.id,
        preferred_dosage: '200mg',
        frequency: 'bi-weekly',
        notes: 'Testosterone replacement therapy',
        status: 'pending'
      })
      .select()
      .single()

    if (jenniferPref) {
      const { data: jenniferApproval } = await supabase
        .from('medication_approvals')
        .insert({
          preference_id: jenniferPref.id,
          provider_id: 'prov2222-2222-2222-2222-222222222222',
          status: 'approved',
          approved_dosage: '200mg',
          approved_frequency: 'bi-weekly',
          provider_notes: 'TRT approved after lab review',
          approval_date: new Date().toISOString()
        })
        .select()
        .single()

      if (jenniferApproval) {
        await supabase
          .from('medication_orders')
          .insert({
            approval_id: jenniferApproval.id,
            patient_id: 'p3333333-3333-3333-3333-333333333333',
            medication_id: testosterone.id,
            quantity: 1,
            unit_price: 199.99,
            total_amount: 199.99,
            payment_status: 'paid',
            fulfillment_status: 'shipped',
            tracking_number: 'TRK123456789'
          })
        console.log('✅ Created Jennifer\'s complete workflow with tracking')
      }
    }

    // David Anderson - Sildenafil (Pending approval)
    console.log('👨 David Anderson - Sildenafil workflow (pending)...')
    const { data: davidPref } = await supabase
      .from('patient_medication_preferences')
      .insert({
        patient_id: 'p4444444-4444-4444-4444-444444444444',
        medication_id: sildenafil.id,
        preferred_dosage: '50mg',
        frequency: 'as_needed',
        notes: 'ED treatment request',
        status: 'pending'
      })
      .select()
      .single()

    if (davidPref) {
      await supabase
        .from('medication_approvals')
        .insert({
          preference_id: davidPref.id,
          provider_id: 'prov2222-2222-2222-2222-222222222222',
          status: 'needs_review',
          provider_notes: 'Awaiting additional consultation'
        })
      console.log('✅ Created David\'s pending approval workflow')
    }

    console.log('\n🎉 Successfully created 4 patients with complete medication workflows!')
    console.log('📋 Summary:')
    console.log('- Sarah Johnson: Semaglutide (Approved → Paid → Processing)')
    console.log('- Michael Roberts: Wegovy (Approved → Paid → Shipped)')
    console.log('- Jennifer Martinez: Testosterone (Approved → Paid → Shipped with tracking)')
    console.log('- David Anderson: Sildenafil (Pending approval)')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the assignment
assignMedicationsToPatients()