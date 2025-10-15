const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function checkTriggers() {
  console.log('🔍 Checking database triggers...')
  
  // Check if trigger exists
  const { data: triggers, error: triggerError } = await supabase
    .rpc('', {}, { 
      query: `
        SELECT 
          trigger_name, 
          event_manipulation, 
          event_object_table, 
          action_statement
        FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
      `
    })
    .catch(() => null)
  
  console.log('Triggers check failed, trying direct SQL...')
  
  // Check if function exists
  const { data: functions, error: funcError } = await supabase
    .rpc('', {}, {
      query: `
        SELECT proname, proowner, prosrc 
        FROM pg_proc 
        WHERE proname = 'handle_new_user'
      `
    })
    .catch(() => null)
  
  console.log('Functions check failed too. Let me try to create a simple test...')
  
  // Try to create a test user directly in auth.users to see what happens
  try {
    const { data, error } = await supabase
      .rpc('', {}, {
        query: `
          INSERT INTO auth.users (
            id, 
            email, 
            encrypted_password, 
            email_confirmed_at, 
            created_at, 
            updated_at,
            raw_user_meta_data,
            confirmation_token
          ) VALUES (
            gen_random_uuid(),
            'direct.test@example.com',
            '$2a$10$dummy',
            NOW(),
            NOW(),
            NOW(),
            '{"role": "patient", "first_name": "Direct", "last_name": "Test"}'::jsonb,
            encode(gen_random_bytes(32), 'hex')
          )
          RETURNING id, email
        `
      })
      
    console.log('Direct insert result:', data)
    console.log('Direct insert error:', error)
  } catch (e) {
    console.log('Direct insert failed:', e.message)
  }
}

checkTriggers().catch(console.error)