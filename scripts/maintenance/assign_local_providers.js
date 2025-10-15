const { createClient } = require('@supabase/supabase-js');

// Local Supabase connection
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function assignPatientsToLocalProviders() {
  try {
    console.log('Connecting to local Supabase...');
    
    // Get all providers
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('id, email, name')
      .order('created_at');

    if (providersError) {
      console.error('Error fetching providers:', providersError);
      return;
    }

    console.log(`Found ${providers.length} providers:`);
    providers.forEach((provider, index) => {
      console.log(`${index + 1}. ${provider.name} (${provider.email})`);
    });

    // Get all patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, email, name')
      .order('created_at');

    if (patientsError) {
      console.error('Error fetching patients:', patientsError);
      return;
    }

    console.log(`\nFound ${patients.length} patients:`);
    patients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.name} (${patient.email})`);
    });

    if (providers.length < 2 || patients.length < 3) {
      console.log('Need at least 2 providers and 3 patients to make assignments');
      return;
    }

    // Check existing assignments
    const { data: existingAssignments, error: assignError } = await supabase
      .from('patient_provider_assignments')
      .select('provider_id, patient_id, providers(email), patients(email)');

    if (assignError) {
      console.error('Error fetching existing assignments:', assignError);
      return;
    }

    console.log(`\nExisting assignments: ${existingAssignments.length}`);
    existingAssignments.forEach(assignment => {
      console.log(`- ${assignment.providers.email} -> ${assignment.patients.email}`);
    });

    // Find providers that don't have many assignments
    const assignmentsByProvider = {};
    existingAssignments.forEach(assignment => {
      if (!assignmentsByProvider[assignment.provider_id]) {
        assignmentsByProvider[assignment.provider_id] = 0;
      }
      assignmentsByProvider[assignment.provider_id]++;
    });

    // Filter providers with fewer assignments
    const providersToAssign = providers.filter(p => 
      (assignmentsByProvider[p.id] || 0) < 3
    ).slice(0, 2); // Take first 2 providers

    console.log(`\nProviders to assign patients to: ${providersToAssign.length}`);
    providersToAssign.forEach(p => {
      console.log(`- ${p.name} (${p.email}) - current assignments: ${assignmentsByProvider[p.id] || 0}`);
    });

    if (providersToAssign.length < 2) {
      console.log('Need at least 2 providers with fewer assignments');
      return;
    }

    // Create new assignments
    const newAssignments = [];
    let patientIndex = 0;

    // Assign 3 patients to each provider
    for (const provider of providersToAssign) {
      for (let i = 0; i < 3 && patientIndex < patients.length; i++) {
        // Check if this assignment already exists
        const existsAlready = existingAssignments.some(existing => 
          existing.provider_id === provider.id && existing.patient_id === patients[patientIndex].id
        );

        if (!existsAlready) {
          newAssignments.push({
            provider_id: provider.id,
            patient_id: patients[patientIndex].id,
            assigned_date: new Date().toISOString().split('T')[0]
          });
        }
        patientIndex++;
      }
    }

    console.log(`\nCreating ${newAssignments.length} new assignments...`);
    
    if (newAssignments.length > 0) {
      const { data: insertData, error: insertError } = await supabase
        .from('patient_provider_assignments')
        .insert(newAssignments)
        .select();

      if (insertError) {
        console.error('Error creating assignments:', insertError);
        return;
      }

      console.log('Successfully created assignments:', insertData.length);
    } else {
      console.log('No new assignments needed');
    }

    // Verify final assignments
    console.log('\nVerifying final assignments...');
    const { data: finalAssignments, error: finalError } = await supabase
      .from('patient_provider_assignments')
      .select(`
        provider_id,
        patient_id,
        providers(email, name),
        patients(email, name)
      `);

    if (finalError) {
      console.error('Error fetching final assignments:', finalError);
      return;
    }

    const assignmentsByProviderFinal = {};
    finalAssignments.forEach(assignment => {
      const providerEmail = assignment.providers.email;
      if (!assignmentsByProviderFinal[providerEmail]) {
        assignmentsByProviderFinal[providerEmail] = [];
      }
      assignmentsByProviderFinal[providerEmail].push({
        patientEmail: assignment.patients.email,
        patientName: assignment.patients.name
      });
    });

    console.log('\n=== FINAL ASSIGNMENT SUMMARY ===');
    Object.keys(assignmentsByProviderFinal).forEach(providerEmail => {
      console.log(`\n${providerEmail}: ${assignmentsByProviderFinal[providerEmail].length} patients`);
      assignmentsByProviderFinal[providerEmail].forEach((patient, index) => {
        console.log(`  ${index + 1}. ${patient.patientName} (${patient.patientEmail})`);
      });
    });

    console.log('\n✅ Provider assignment completed successfully!');
    console.log('You can now test the provider patient tables with different provider accounts.');

  } catch (error) {
    console.error('Script error:', error);
  }
}

assignPatientsToLocalProviders();