const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createUsers() {
  console.log('🔧 Creating test users...');
  
  const users = [
    { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', email: 'admin@test.com', password: 'admin123' },
    { id: '11111111-1111-1111-1111-111111111111', email: 'sarah.j@test.com', password: 'patient123' },
    { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', email: 'dr.watson@test.com', password: 'provider123' }
  ];
  
  for (const user of users) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { role: 'auto' }
      });
      
      if (error) {
        console.log(`❌ Failed to create ${user.email}:`, error.message);
      } else {
        console.log(`✅ Created ${user.email}`);
      }
    } catch (err) {
      console.log(`❌ Exception for ${user.email}:`, err.message);
    }
  }
  
  // Test admin login
  console.log('\n🔍 Testing admin login...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    if (error) {
      console.log('❌ Admin login failed:', error.message);
    } else {
      console.log('✅ Admin login successful');
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.log('❌ Admin login exception:', err.message);
  }
}

createUsers();