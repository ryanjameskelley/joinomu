const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Use the access token to execute SQL directly
const supabaseUrl = 'https://rwnhxggkhjadnfixudcc.supabase.co';
const serviceRoleKey = 'sbp_8288387e386217e44244583603872bd718e56735'; // This is actually an access token

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSQLFix() {
  try {
    console.log('Reading SQL fix file...');
    const sqlContent = fs.readFileSync('./fix_trigger_columns.sql', 'utf8');
    
    console.log('Executing SQL fix...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      process.exit(1);
    }
    
    console.log('SQL fix executed successfully:', data);
  } catch (err) {
    console.error('Script error:', err);
    process.exit(1);
  }
}

executeSQLFix();