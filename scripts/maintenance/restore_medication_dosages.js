// Restore medication_dosages table from backup data
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function restoreMedicationDosages() {
  try {
    console.log('🔄 Restoring medication dosages from backup...');
    
    // All medication dosages from backup
    const dosages = [
      { id: '7564d035-7ceb-4504-aa14-a1315240ab23', medication_id: '213a3ca1-4b4a-4ef5-9332-1a39d3817dae', strength: '3.0mg', unit_price: 1099.99, available: true, sort_order: 1 },
      { id: '72f9a5cd-a3ff-4609-875c-a0f485137728', medication_id: '37820256-ac89-48f9-9f63-258c28c1f89d', strength: '1.62%', unit_price: 299.99, available: true, sort_order: 1 },
      { id: '5d642615-0399-461d-b449-7fc5d803b338', medication_id: '427c2f0b-f65a-4534-a807-f0c25d24fe11', strength: '37.5mg', unit_price: 89.99, available: true, sort_order: 1 },
      { id: '7b81bb69-557b-41a1-99dc-467c7805a736', medication_id: '49f60cf1-37cb-46a9-8fa9-efebba8a00a2', strength: '50mg', unit_price: 89.99, available: true, sort_order: 1 },
      { id: '324b0f06-c72b-4f2e-87b0-058755e99640', medication_id: '4df3ad68-30f3-4af3-ac90-6b7aacee6d30', strength: '250mg/ml', unit_price: 219.99, available: true, sort_order: 1 },
      { id: 'cbd74c62-7ad0-4d44-9f34-81607837edf4', medication_id: '5713e010-6a56-4d16-9454-fc396a630c0b', strength: '0.5mg', unit_price: 899.99, available: true, sort_order: 1 },
      { id: '670ad4bd-fe06-401f-9c92-daac775cca82', medication_id: '5c1b38e4-405f-4ce1-99fa-6e71c45f95bc', strength: '2.5mg', unit_price: 1199.99, available: true, sort_order: 1 },
      { id: 'ebf02e1f-1a8d-40e9-99b8-54aa1e0aed0f', medication_id: '991e47aa-9dd3-4d3a-8291-47f6ce39ba18', strength: '5000 IU', unit_price: 149.99, available: true, sort_order: 1 },
      { id: '8098260a-408e-4167-b184-bbf31f169500', medication_id: '9e2ad559-8f87-48d1-91c4-535d908a0bfb', strength: '1.0mg', unit_price: 1299.99, available: true, sort_order: 1 },
      { id: '08e49198-c617-4123-adbd-1b62f58d869b', medication_id: 'a7ba7cb8-d5b5-4890-abb8-4620d0d23356', strength: '120mg', unit_price: 199.99, available: true, sort_order: 1 },
      { id: '350dc3f8-3f0b-4a1c-a78f-c08b58d6d895', medication_id: 'acd6fefd-3d48-43d7-b1e8-e6bcd653aca6', strength: '1mg', unit_price: 79.99, available: true, sort_order: 1 },
      { id: '434e8255-9840-44a1-95c9-9e2e823e08c7', medication_id: 'b62cf870-7009-4be7-b896-bf7efab0744f', strength: '200mg/ml', unit_price: 199.99, available: true, sort_order: 1 },
      { id: '188c5d06-60b9-482c-8062-0a8c7b5c45ea', medication_id: 'c5ad6fef-becb-45fb-a466-3df6b24c845a', strength: '20mg', unit_price: 99.99, available: true, sort_order: 1 },
      // Additional Tirzepatide dosages
      { id: '44f2d18b-c882-40bc-ab7d-a1e7afbadee1', medication_id: '5c1b38e4-405f-4ce1-99fa-6e71c45f95bc', strength: '5.0mg', unit_price: 1399.99, available: true, sort_order: 10 },
      { id: '9939a2db-7bce-4842-bf2c-d44326e91416', medication_id: '5c1b38e4-405f-4ce1-99fa-6e71c45f95bc', strength: '7.5mg', unit_price: 1599.99, available: true, sort_order: 20 },
      { id: '541aa129-92eb-496c-abe6-1e02d73a2d4b', medication_id: '5c1b38e4-405f-4ce1-99fa-6e71c45f95bc', strength: '10mg', unit_price: 1799.99, available: true, sort_order: 30 },
      { id: 'bac86964-2143-4ca8-9772-73c2ab11060e', medication_id: '5c1b38e4-405f-4ce1-99fa-6e71c45f95bc', strength: '12.5mg', unit_price: 1999.99, available: true, sort_order: 40 },
      { id: 'c0af327b-9f53-4f55-a6d9-8b814a5318b0', medication_id: '5c1b38e4-405f-4ce1-99fa-6e71c45f95bc', strength: '15mg', unit_price: 2199.99, available: true, sort_order: 50 },
      // Additional Semaglutide dosages
      { id: '77f2c6f1-3123-4813-bb22-bef880af17a0', medication_id: '5713e010-6a56-4d16-9454-fc396a630c0b', strength: '0.25mg', unit_price: 799.99, available: true, sort_order: 1 },
      { id: 'aa1a4f5e-03d1-4607-af40-55dace8d3366', medication_id: '5713e010-6a56-4d16-9454-fc396a630c0b', strength: '1.0mg', unit_price: 999.99, available: true, sort_order: 11 },
      { id: '2746fc79-53b2-4b18-9c79-42b84c3756dc', medication_id: '5713e010-6a56-4d16-9454-fc396a630c0b', strength: '2.0mg', unit_price: 1199.99, available: true, sort_order: 21 },
      // Additional Testosterone Cypionate dosages
      { id: 'd503dddb-19f2-4e04-8f97-0998314c9036', medication_id: 'b62cf870-7009-4be7-b896-bf7efab0744f', strength: '100mg/ml', unit_price: 159.99, available: true, sort_order: 5 },
      { id: '85872f21-cdb6-49e9-a7f3-241165ceaaf7', medication_id: 'b62cf870-7009-4be7-b896-bf7efab0744f', strength: '250mg/ml', unit_price: 239.99, available: true, sort_order: 15 }
    ];
    
    console.log(`🔄 Inserting ${dosages.length} medication dosages...`);
    
    const { data: insertedDosages, error: dosageError } = await supabase
      .from('medication_dosages')
      .insert(dosages)
      .select();
    
    if (dosageError) {
      console.error('❌ Error inserting dosages:', dosageError);
      return;
    }
    
    console.log('✅ Successfully restored medication dosages:');
    
    // Group by medication for display
    const dosagesByMed = {};
    insertedDosages.forEach(dosage => {
      if (!dosagesByMed[dosage.medication_id]) {
        dosagesByMed[dosage.medication_id] = [];
      }
      dosagesByMed[dosage.medication_id].push(dosage);
    });
    
    // Get medication names for display
    const { data: medications } = await supabase
      .from('medications')
      .select('id, brand_name')
      .in('id', Object.keys(dosagesByMed));
    
    const medMap = {};
    medications?.forEach(med => {
      medMap[med.id] = med.brand_name;
    });
    
    Object.keys(dosagesByMed).forEach(medId => {
      const medName = medMap[medId] || 'Unknown';
      const dosages = dosagesByMed[medId].sort((a, b) => a.sort_order - b.sort_order);
      console.log(`   ${medName}: ${dosages.map(d => d.strength).join(', ')}`);
    });
    
    console.log(`\n📊 Total dosages restored: ${insertedDosages.length}`);
    console.log('🎯 Medication dropdown should now work!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

restoreMedicationDosages();