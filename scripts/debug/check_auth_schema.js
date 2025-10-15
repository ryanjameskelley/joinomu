// Check the auth schema and see what's actually happening
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkAuthSchema() {
  console.log('🔍 Checking auth schema and configuration...\n');

  try {
    // 1. Check what tables exist in auth schema
    console.log('📋 Tables in auth schema:');
    const { data: authTables } = await supabase.rpc('sql', {
      query: `
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        ORDER BY table_name
      `
    });

    if (authTables) {
      authTables.forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`);
      });
    }

    // 2. Check auth.users table structure
    console.log('\n📊 Auth.users table structure:');
    const { data: userColumns } = await supabase.rpc('sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'users'
        ORDER BY ordinal_position
      `
    });

    if (userColumns) {
      userColumns.slice(0, 10).forEach(col => { // Show first 10 columns
        console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
      });
      if (userColumns.length > 10) {
        console.log(`  ... and ${userColumns.length - 10} more columns`);
      }
    }

    // 3. Check if auth.users table is empty
    console.log('\n👤 Auth.users content:');
    const { data: userCount } = await supabase.rpc('sql', {
      query: 'SELECT COUNT(*) as count FROM auth.users'
    });
    console.log(`  Total users: ${userCount?.[0]?.count || 0}`);

    if (userCount?.[0]?.count > 0) {
      const { data: sampleUsers } = await supabase.rpc('sql', {
        query: 'SELECT id, email, created_at, raw_user_meta_data FROM auth.users ORDER BY created_at DESC LIMIT 3'
      });
      
      if (sampleUsers) {
        console.log('  Recent users:');
        sampleUsers.forEach(user => {
          console.log(`    - ${user.email} (${user.id.slice(0,8)}...) created ${user.created_at}`);
        });
      }
    }

    // 4. Check our trigger status
    console.log('\n🔧 Trigger status:');
    const { data: triggerInfo } = await supabase.rpc('sql', {
      query: `
        SELECT t.tgname, t.tgenabled, c.relname, n.nspname
        FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        WHERE t.tgname = 'on_auth_user_created'
      `
    });

    if (triggerInfo && triggerInfo.length > 0) {
      const trigger = triggerInfo[0];
      console.log(`  ✅ Trigger exists: ${trigger.tgname} on ${trigger.nspname}.${trigger.relname}`);
      console.log(`  Enabled: ${trigger.tgenabled === 'O' ? 'Yes' : 'No'}`);
    } else {
      console.log('  ❌ Trigger not found');
    }

    // 5. Check if we can see the signup in real-time
    console.log('\n🔐 Testing real-time signup observation...');
    
    // First get current count
    const { data: beforeCount } = await supabase.rpc('sql', {
      query: 'SELECT COUNT(*) as count FROM auth.users'
    });
    console.log(`  Users before: ${beforeCount?.[0]?.count || 0}`);

    // Now perform a signup and immediately check
    const testEmail = `realtime.${Date.now()}@example.com`;
    console.log(`  Performing signup for: ${testEmail}`);
    
    const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');
    
    const { data: signupData, error: signupError } = await anonClient.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: {
        data: {
          role: 'provider',
          firstName: 'Realtime',
          lastName: 'Test'
        }
      }
    });

    if (signupError) {
      console.log(`  ❌ Signup failed: ${signupError.message}`);
      return;
    }

    console.log(`  ✅ Signup response received - User ID: ${signupData.user?.id}`);

    // Check count immediately
    const { data: afterCount } = await supabase.rpc('sql', {
      query: 'SELECT COUNT(*) as count FROM auth.users'
    });
    console.log(`  Users after: ${afterCount?.[0]?.count || 0}`);

    // Wait and check again
    await new Promise(resolve => setTimeout(resolve, 2000));
    const { data: finalCount } = await supabase.rpc('sql', {
      query: 'SELECT COUNT(*) as count FROM auth.users'
    });
    console.log(`  Users after 2s: ${finalCount?.[0]?.count || 0}`);

    // 6. Check if the user exists anywhere in auth schema
    console.log('\n🔍 Searching for the created user...');
    const userId = signupData.user?.id;
    
    // Check in each auth table
    const authTableNames = authTables?.map(t => t.table_name) || [];
    for (const tableName of authTableNames) {
      if (tableName.includes('user')) {
        try {
          const { data: foundUser } = await supabase.rpc('sql', {
            query: `SELECT COUNT(*) as count FROM auth.${tableName} WHERE id = '${userId}'`
          });
          console.log(`  ${tableName}: ${foundUser?.[0]?.count || 0} records`);
        } catch (error) {
          console.log(`  ${tableName}: Error checking - ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('💥 Error checking auth schema:', error);
  }
}

checkAuthSchema();