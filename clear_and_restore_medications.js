// Clear and restore all medications
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function clearAndRestoreMedications() {
  try {
    console.log('🗑️ Clearing existing medications...');
    
    const { error: clearError } = await supabase
      .from('medications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (clearError) {
      console.error('❌ Error clearing medications:', clearError);
      return;
    }
    
    console.log('✅ Medications table cleared');
    
    // Now insert all medications
    console.log('🔄 Restoring all 13 medications from backup...');
    
    // Copy the same medications array from the other script
    const medications = [
      // Weight Loss Medications  
      {
        id: '5713e010-6a56-4d16-9454-fc396a630c0b',
        name: 'Semaglutide', generic_name: 'Semaglutide', brand_name: 'Ozempic',
        dosage_form: 'injection', strength: '0.5mg',
        description: 'GLP-1 receptor agonist for weight management and diabetes',
        category: 'weight_loss', unit_price: 899.99, requires_prescription: true, active: true
      },
      {
        id: '9e2ad559-8f87-48d1-91c4-535d908a0bfb',
        name: 'Semaglutide', generic_name: 'Semaglutide', brand_name: 'Wegovy',
        dosage_form: 'injection', strength: '1.0mg',
        description: 'GLP-1 receptor agonist specifically for chronic weight management',
        category: 'weight_loss', unit_price: 1299.99, requires_prescription: true, active: true
      },
      {
        id: '5c1b38e4-405f-4ce1-99fa-6e71c45f95bc',
        name: 'Tirzepatide', generic_name: 'Tirzepatide', brand_name: 'Mounjaro',
        dosage_form: 'injection', strength: '2.5mg',
        description: 'Dual GIP/GLP-1 receptor agonist for weight loss',
        category: 'weight_loss', unit_price: 1199.99, requires_prescription: true, active: true
      },
      {
        id: '213a3ca1-4b4a-4ef5-9332-1a39d3817dae',
        name: 'Liraglutide', generic_name: 'Liraglutide', brand_name: 'Saxenda',
        dosage_form: 'injection', strength: '3.0mg',
        description: 'GLP-1 receptor agonist for weight management',
        category: 'weight_loss', unit_price: 1099.99, requires_prescription: true, active: true
      },
      {
        id: 'a7ba7cb8-d5b5-4890-abb8-4620d0d23356',
        name: 'Orlistat', generic_name: 'Orlistat', brand_name: 'Xenical',
        dosage_form: 'capsule', strength: '120mg',
        description: 'Lipase inhibitor for weight loss',
        category: 'weight_loss', unit_price: 199.99, requires_prescription: true, active: true
      },
      {
        id: '427c2f0b-f65a-4534-a807-f0c25d24fe11',
        name: 'Phentermine', generic_name: 'Phentermine', brand_name: 'Adipex-P',
        dosage_form: 'tablet', strength: '37.5mg',
        description: 'Appetite suppressant for short-term weight loss',
        category: 'weight_loss', unit_price: 89.99, requires_prescription: true, active: true
      },
      // Men's Health Medications
      {
        id: 'b62cf870-7009-4be7-b896-bf7efab0744f',
        name: 'Testosterone Cypionate', generic_name: 'Testosterone Cypionate', brand_name: 'Depo-Testosterone',
        dosage_form: 'injection', strength: '200mg/ml',
        description: 'Testosterone replacement therapy for hypogonadism',
        category: 'mens_health', unit_price: 199.99, requires_prescription: true, active: true
      },
      {
        id: '4df3ad68-30f3-4af3-ac90-6b7aacee6d30',
        name: 'Testosterone Enanthate', generic_name: 'Testosterone Enanthate', brand_name: 'Delatestryl',
        dosage_form: 'injection', strength: '250mg/ml',
        description: 'Long-acting testosterone for hormone replacement',
        category: 'mens_health', unit_price: 219.99, requires_prescription: true, active: true
      },
      {
        id: '37820256-ac89-48f9-9f63-258c28c1f89d',
        name: 'Testosterone Gel', generic_name: 'Testosterone', brand_name: 'AndroGel',
        dosage_form: 'gel', strength: '1.62%',
        description: 'Topical testosterone replacement therapy',
        category: 'mens_health', unit_price: 299.99, requires_prescription: true, active: true
      },
      {
        id: '49f60cf1-37cb-46a9-8fa9-efebba8a00a2',
        name: 'Sildenafil', generic_name: 'Sildenafil', brand_name: 'Viagra',
        dosage_form: 'tablet', strength: '50mg',
        description: 'PDE5 inhibitor for erectile dysfunction',
        category: 'mens_health', unit_price: 89.99, requires_prescription: true, active: true
      },
      {
        id: 'c5ad6fef-becb-45fb-a466-3df6b24c845a',
        name: 'Tadalafil', generic_name: 'Tadalafil', brand_name: 'Cialis',
        dosage_form: 'tablet', strength: '20mg',
        description: 'Long-acting PDE5 inhibitor for erectile dysfunction',
        category: 'mens_health', unit_price: 99.99, requires_prescription: true, active: true
      },
      {
        id: 'acd6fefd-3d48-43d7-b1e8-e6bcd653aca6',
        name: 'Finasteride', generic_name: 'Finasteride', brand_name: 'Propecia',
        dosage_form: 'tablet', strength: '1mg',
        description: '5-alpha reductase inhibitor for male pattern baldness',
        category: 'mens_health', unit_price: 79.99, requires_prescription: true, active: true
      },
      {
        id: '991e47aa-9dd3-4d3a-8291-47f6ce39ba18',
        name: 'HCG', generic_name: 'Human Chorionic Gonadotropin', brand_name: 'Pregnyl',
        dosage_form: 'injection', strength: '5000 IU',
        description: 'Hormone therapy to support testosterone production',
        category: 'mens_health', unit_price: 149.99, requires_prescription: true, active: true
      }
    ];
    
    const { data: insertedMeds, error: insertError } = await supabase
      .from('medications')
      .insert(medications)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting medications:', insertError);
      return;
    }
    
    console.log('✅ Successfully restored all medications:');
    console.log(`📊 Weight Loss (${insertedMeds.filter(m => m.category === 'weight_loss').length}):`);
    insertedMeds.filter(m => m.category === 'weight_loss').forEach((med, i) => {
      console.log(`   ${i + 1}. ${med.brand_name} (${med.strength})`);
    });
    
    console.log(`📊 Men's Health (${insertedMeds.filter(m => m.category === 'mens_health').length}):`);
    insertedMeds.filter(m => m.category === 'mens_health').forEach((med, i) => {
      console.log(`   ${i + 1}. ${med.brand_name} (${med.strength})`);
    });
    
    console.log(`\n📊 Total medications restored: ${insertedMeds.length}`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

clearAndRestoreMedications();