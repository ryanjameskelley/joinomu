-- Completely disable the auth trigger as recommended in the guide
-- and let the auth service fallback pattern handle all record creation

-- Drop the trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verify the trigger is gone
SELECT 
  'Auth trigger disabled' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
    THEN '❌ Trigger still exists'
    ELSE '✅ Trigger removed'
  END as trigger_status;