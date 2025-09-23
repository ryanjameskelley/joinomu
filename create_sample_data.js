const { createClient } = require('@supabase/supabase-js')

// Use your local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSampleData() {
  console.log('🏥 Creating complete sample data with medication workflows...\n')

  try {
    // Step 1: Create sample user accounts
    console.log('👥 1. Creating user profiles...')
    
    const profileData = [
      { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.j@test.com', role: 'patient' },
      { first_name: 'Michael', last_name: 'Roberts', email: 'michael.r@test.com', role: 'patient' },
      { first_name: 'Jennifer', last_name: 'Martinez', email: 'jennifer.m@test.com', role: 'patient' },
      { first_name: 'David', last_name: 'Anderson', email: 'david.a@test.com', role: 'patient' },
      { first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin' },
      { first_name: 'Dr. Emily', last_name: 'Watson', email: 'dr.watson@test.com', role: 'provider' },
      { first_name: 'Dr. James', last_name: 'Wilson', email: 'dr.wilson@test.com', role: 'provider' }
    ]

    const createdProfiles = []
    for (const profile of profileData) {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single()
      
      if (error) {
        console.error(`❌ Error creating ${profile.first_name}:`, error.message)
      } else {
        console.log(`✅ Created profile: ${profile.first_name} ${profile.last_name}`)
        createdProfiles.push(data)
      }
    }

    // Step 2: Create patient records
    console.log('\n🏥 2. Creating patient records...')
    const patientProfiles = createdProfiles.filter(p => p.role === 'patient')
    const createdPatients = []

    for (const profile of patientProfiles) {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          profile_id: profile.id,
          phone: `555-010${patientProfiles.indexOf(profile) + 1}`,
          has_completed_intake: true
        })
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error creating patient:', error.message)
      } else {
        console.log(`✅ Created patient for ${profile.first_name}`)
        createdPatients.push(data)
      }
    }

    // Step 3: Create admin record
    console.log('\n👨‍💼 3. Creating admin record...')
    const adminProfile = createdProfiles.find(p => p.role === 'admin')
    if (adminProfile) {
      const { error } = await supabase
        .from('admins')
        .insert({
          profile_id: adminProfile.id,
          permissions: ['all']
        })
      
      if (error) {
        console.error('❌ Error creating admin:', error.message)
      } else {
        console.log('✅ Created admin record')
      }
    }

    // Step 4: Create provider records
    console.log('\n👨‍⚕️ 4. Creating provider records...')
    const providerProfiles = createdProfiles.filter(p => p.role === 'provider')
    const createdProviders = []

    const providerData = [
      { specialty: 'Endocrinology', license_number: 'LIC001' },
      { specialty: 'Men\'s Health', license_number: 'LIC002' }
    ]

    for (let i = 0; i < providerProfiles.length; i++) {
      const { data, error } = await supabase
        .from('providers')
        .insert({
          profile_id: providerProfiles[i].id,
          specialty: providerData[i].specialty,
          license_number: providerData[i].license_number,
          phone: `555-020${i + 1}`,
          active: true
        })
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error creating provider:', error.message)
      } else {
        console.log(`✅ Created provider: ${providerData[i].specialty}`)
        createdProviders.push(data)
      }
    }

    // Step 5: Assign patients to providers
    console.log('\n🔗 5. Assigning patients to providers...')
    if (createdPatients.length >= 4 && createdProviders.length >= 2) {
      const assignments = [
        // Dr. Watson (Endocrinology) gets weight loss patients
        { provider_id: createdProviders[0].id, patient_id: createdPatients[0].id, treatment_type: 'weight_loss', is_primary: true },
        { provider_id: createdProviders[0].id, patient_id: createdPatients[1].id, treatment_type: 'weight_loss', is_primary: true },
        // Dr. Wilson (Men's Health) gets men's health patients
        { provider_id: createdProviders[1].id, patient_id: createdPatients[2].id, treatment_type: 'mens_health', is_primary: true },
        { provider_id: createdProviders[1].id, patient_id: createdPatients[3].id, treatment_type: 'mens_health', is_primary: true }
      ]

      for (const assignment of assignments) {
        const { error } = await supabase
          .from('patient_assignments')
          .insert({
            ...assignment,
            assigned_date: new Date().toISOString().split('T')[0]
          })
        
        if (error) {
          console.error('❌ Error creating assignment:', error.message)
        } else {
          console.log(`✅ Assigned patient to provider`)
        }
      }
    }

    // Step 6: Get medications and create medication workflows
    console.log('\n💊 6. Creating medication workflows...')
    const { data: medications } = await supabase
      .from('medications')
      .select('id, name, strength, category, unit_price')

    const semaglutide = medications.find(m => m.name === 'Semaglutide' && m.strength === '0.5mg')
    const wegovy = medications.find(m => m.name === 'Semaglutide' && m.strength === '1.0mg')
    const testosterone = medications.find(m => m.name === 'Testosterone Cypionate')
    const sildenafil = medications.find(m => m.name === 'Sildenafil')

    // Create complete medication workflows
    const medicationWorkflows = [
      {
        patient: createdPatients[0],
        provider: createdProviders[0],
        medication: semaglutide,
        dosage: '0.5mg',
        frequency: 'weekly',
        notes: 'Starting with lower dose for weight management',
        status: 'approved',
        payment: 'paid',
        fulfillment: 'processing'
      },
      {
        patient: createdPatients[1],
        provider: createdProviders[0],
        medication: wegovy,
        dosage: '1.0mg',
        frequency: 'weekly',
        notes: 'Higher dose for aggressive weight loss',
        status: 'approved',
        payment: 'paid',
        fulfillment: 'shipped'
      },
      {
        patient: createdPatients[2],
        provider: createdProviders[1],
        medication: testosterone,
        dosage: '200mg',
        frequency: 'bi-weekly',
        notes: 'Testosterone replacement therapy',
        status: 'approved',
        payment: 'paid',
        fulfillment: 'shipped',
        tracking: 'TRK123456789'
      },
      {
        patient: createdPatients[3],
        provider: createdProviders[1],
        medication: sildenafil,
        dosage: '50mg',
        frequency: 'as_needed',
        notes: 'ED treatment request',
        status: 'needs_review',
        payment: 'pending',
        fulfillment: 'pending'
      }
    ]

    for (let i = 0; i < medicationWorkflows.length; i++) {
      const workflow = medicationWorkflows[i]
      console.log(`\n   ${i + 1}. Creating ${workflow.medication.name} workflow...`)
      
      // Create preference
      const { data: preference, error: prefError } = await supabase
        .from('patient_medication_preferences')
        .insert({
          patient_id: workflow.patient.id,
          medication_id: workflow.medication.id,
          preferred_dosage: workflow.dosage,
          frequency: workflow.frequency,
          notes: workflow.notes,
          status: 'pending'
        })
        .select()
        .single()

      if (prefError) {
        console.error('❌ Error creating preference:', prefError.message)
        continue
      }

      // Create approval
      const { data: approval, error: approvalError } = await supabase
        .from('medication_approvals')
        .insert({
          preference_id: preference.id,
          provider_id: workflow.provider.id,
          status: workflow.status,
          approved_dosage: workflow.status === 'approved' ? workflow.dosage : null,
          approved_frequency: workflow.status === 'approved' ? workflow.frequency : null,
          provider_notes: workflow.status === 'approved' ? 
            `Approved ${workflow.medication.name} treatment` : 
            'Awaiting additional consultation',
          approval_date: workflow.status === 'approved' ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (approvalError) {
        console.error('❌ Error creating approval:', approvalError.message)
        continue
      }

      // Create order (only if approved)
      if (workflow.status === 'approved') {
        const orderData = {
          approval_id: approval.id,
          patient_id: workflow.patient.id,
          medication_id: workflow.medication.id,
          quantity: 1,
          unit_price: workflow.medication.unit_price,
          total_amount: workflow.medication.unit_price,
          payment_status: workflow.payment,
          fulfillment_status: workflow.fulfillment
        }

        if (workflow.tracking) {
          orderData.tracking_number = workflow.tracking
        }

        const { error: orderError } = await supabase
          .from('medication_orders')
          .insert(orderData)

        if (orderError) {
          console.error('❌ Error creating order:', orderError.message)
        } else {
          console.log(`✅ Created complete ${workflow.medication.name} workflow`)
        }
      } else {
        console.log(`✅ Created pending ${workflow.medication.name} workflow`)
      }
    }

    console.log('\n🎉 Successfully created complete sample data!')
    console.log('\n📋 Final Summary:')
    console.log('- 4 Patients with assigned providers')
    console.log('- 2 Providers (Endocrinology & Men\'s Health)')
    console.log('- 1 Admin user')
    console.log('- 4 Complete medication workflows:')
    console.log('  • Semaglutide (Approved → Paid → Processing)')
    console.log('  • Wegovy (Approved → Paid → Shipped)')
    console.log('  • Testosterone (Approved → Paid → Shipped with tracking)')
    console.log('  • Sildenafil (Pending approval)')
    console.log('\n✅ Ready to test in admin and provider dashboards!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the creation
createSampleData()