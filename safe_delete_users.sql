-- Safe deletion that disables triggers to avoid constraint issues

-- Disable triggers temporarily to avoid audit/history issues
SET session_replication_role = replica;

-- Delete in correct order
DELETE FROM appointment_history;
DELETE FROM appointments;
DELETE FROM patient_medication_preferences;
DELETE FROM clinical_notes;
DELETE FROM patient_assignments;
DELETE FROM provider_schedules;
DELETE FROM patients;
DELETE FROM providers;
DELETE FROM admins;
DELETE FROM profiles;
DELETE FROM auth.users;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify cleanup
SELECT 
    'Cleanup status' as info,
    (SELECT COUNT(*) FROM auth.users) as auth_users,
    (SELECT COUNT(*) FROM profiles) as profiles,
    (SELECT COUNT(*) FROM patients) as patients,
    (SELECT COUNT(*) FROM providers) as providers,
    (SELECT COUNT(*) FROM patient_assignments) as assignments,
    (SELECT COUNT(*) FROM appointments) as appointments;