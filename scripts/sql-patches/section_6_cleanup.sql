-- ===========================================
-- SECTION 6: Cleanup Existing Data
-- ===========================================

-- Remove existing RPC bypass functions (keep role detection)
DROP FUNCTION IF EXISTS create_missing_patients();
DROP FUNCTION IF EXISTS get_provider_by_user_id(UUID);
DROP FUNCTION IF EXISTS get_provider_patients(UUID);

-- Clear existing test data for clean start
DELETE FROM patient_providers;
DELETE FROM patients WHERE email LIKE '%@example.com' OR email = 'ryan@ryankelleydesign.com';
DELETE FROM providers WHERE email LIKE '%provider%' OR email = 'ryan@ryankelleydesign.com';
DELETE FROM admins WHERE email LIKE '%admin%' OR email = 'ryan@ryankelleydesign.com';