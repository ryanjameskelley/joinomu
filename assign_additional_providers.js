const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xxhkwgkbdzhwapudijzq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4aGt3Z2tiZHpod2FwdWRpanpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDY0OTcyOCwiZXhwIjoyMDUwMjI1NzI4fQ.Q1SFHP3NRAj3lRJIaGsb_gKpWEeZ4cVvAqzXz7hNDRo'
);

async function assignPatientsToOtherProviders() {
  try {
    console.log('Checking existing providers...');
    
    // Get all providers
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('id, profile_id, email, name')
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
      .select('id, profile_id, email, name')
      .order('created_at');

    if (patientsError) {
      console.error('Error fetching patients:', patientsError);
      return;
    }

    console.log(`\nFound ${patients.length} patients`);

    // Check existing assignments
    const { data: existingAssignments, error: assignError } = await supabase
      .from('patient_provider_assignments')
      .select('provider_id, patient_id');

    if (assignError) {
      console.error('Error fetching existing assignments:', assignError);
      return;
    }

    const assignedPatients = new Set(existingAssignments.map(a => a.patient_id));
    const assignedToProviders = {};
    existingAssignments.forEach(a => {
      if (!assignedToProviders[a.provider_id]) {
        assignedToProviders[a.provider_id] = [];
      }
      assignedToProviders[a.provider_id].push(a.patient_id);
    });

    console.log(`\nExisting assignments: ${existingAssignments.length}`);

    // Exclude the already heavily assigned provider
    const providersToAssign = providers.filter(p => 
      !p.email.includes('provider-test-1758500385268@example.com')
    );

    console.log(`\nProviders to assign patients to: ${providersToAssign.length}`);

    // Get unassigned patients
    const unassignedPatients = patients.filter(p => !assignedPatients.has(p.id));
    console.log(`Unassigned patients: ${unassignedPatients.length}`);

    if (unassignedPatients.length === 0) {
      console.log('No unassigned patients available. Will reassign some existing patients.');
      // Use first few patients for reassignment
      const patientsToReassign = patients.slice(0, 6);
      
      let assignmentIndex = 0;
      const newAssignments = [];

      for (const provider of providersToAssign) {
        // Assign 2-3 patients per provider
        const patientsForThisProvider = patientsToReassign.slice(assignmentIndex, assignmentIndex + 3);
        
        for (const patient of patientsForThisProvider) {
          newAssignments.push({
            provider_id: provider.id,
            patient_id: patient.id,
            assigned_date: new Date().toISOString().split('T')[0]
          });
        }
        
        assignmentIndex += 3;
        if (assignmentIndex >= patientsToReassign.length) break;
      }

      console.log(`\nCreating ${newAssignments.length} new assignments...`);
      
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
      // Assign unassigned patients
      let assignmentIndex = 0;
      const newAssignments = [];

      for (const provider of providersToAssign) {
        // Assign 2-3 patients per provider
        const patientsForThisProvider = unassignedPatients.slice(assignmentIndex, assignmentIndex + 3);
        
        for (const patient of patientsForThisProvider) {
          newAssignments.push({
            provider_id: provider.id,
            patient_id: patient.id,
            assigned_date: new Date().toISOString().split('T')[0]
          });
        }
        
        assignmentIndex += 3;
        if (assignmentIndex >= unassignedPatients.length) break;
      }

      console.log(`\nCreating ${newAssignments.length} new assignments...`);
      
      const { data: insertData, error: insertError } = await supabase
        .from('patient_provider_assignments')
        .insert(newAssignments)
        .select();

      if (insertError) {
        console.error('Error creating assignments:', insertError);
        return;
      }

      console.log('Successfully created assignments:', insertData.length);
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

    const assignmentsByProvider = {};
    finalAssignments.forEach(assignment => {
      const providerEmail = assignment.providers.email;
      if (!assignmentsByProvider[providerEmail]) {
        assignmentsByProvider[providerEmail] = [];
      }
      assignmentsByProvider[providerEmail].push({
        patientEmail: assignment.patients.email,
        patientName: assignment.patients.name
      });
    });

    console.log('\nFinal assignment summary:');
    Object.keys(assignmentsByProvider).forEach(providerEmail => {
      console.log(`\n${providerEmail}: ${assignmentsByProvider[providerEmail].length} patients`);
      assignmentsByProvider[providerEmail].forEach((patient, index) => {
        console.log(`  ${index + 1}. ${patient.patientName} (${patient.patientEmail})`);
      });
    });

  } catch (error) {
    console.error('Script error:', error);
  }
}

assignPatientsToOtherProviders();