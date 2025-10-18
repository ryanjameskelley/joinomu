-- Delete users and related data in correct order
-- Handle foreign key constraints properly

-- First, show what we're about to delete
SELECT 
    'Users to delete' as info,
    prof.email,
    prof.role,
    prof.id as profile_id
FROM profiles prof
ORDER BY prof.created_at DESC;

-- Delete appointments first (they reference patient_assignments)
DELETE FROM appointments 
WHERE assignment_id IN (
    SELECT pa.id FROM patient_assignments pa 
    JOIN patients pt ON pa.patient_id = pt.id
    JOIN profiles prof ON pt.profile_id = prof.id
);

-- Delete medication preferences/orders that might reference patients
DELETE FROM patient_medication_preferences 
WHERE patient_id IN (
    SELECT pt.id FROM patients pt 
    JOIN profiles prof ON pt.profile_id = prof.id
);

-- Delete any other tables that might reference patients or providers
DELETE FROM clinical_notes 
WHERE patient_id IN (
    SELECT pt.id FROM patients pt 
    JOIN profiles prof ON pt.profile_id = prof.id
)
OR provider_id IN (
    SELECT pr.id FROM providers pr 
    JOIN profiles prof ON pr.profile_id = prof.id
);

-- Delete patient assignments
DELETE FROM patient_assignments 
WHERE patient_id IN (
    SELECT pt.id FROM patients pt 
    JOIN profiles prof ON pt.profile_id = prof.id
);

-- Delete provider schedules
DELETE FROM provider_schedules 
WHERE provider_id IN (
    SELECT pr.id FROM providers pr 
    JOIN profiles prof ON pr.profile_id = prof.id
);

-- Delete patients
DELETE FROM patients 
WHERE profile_id IN (SELECT id FROM profiles);

-- Delete providers  
DELETE FROM providers 
WHERE profile_id IN (SELECT id FROM profiles);

-- Delete admins
DELETE FROM admins 
WHERE profile_id IN (SELECT id FROM profiles);

-- Delete profiles
DELETE FROM profiles;

-- Delete auth users (this will cascade)
DELETE FROM auth.users;

-- Verify everything is clean
SELECT 
    'Cleanup status' as info,
    (SELECT COUNT(*) FROM auth.users) as auth_users,
    (SELECT COUNT(*) FROM profiles) as profiles,
    (SELECT COUNT(*) FROM patients) as patients,
    (SELECT COUNT(*) FROM providers) as providers,
    (SELECT COUNT(*) FROM patient_assignments) as assignments,
    (SELECT COUNT(*) FROM appointments) as appointments;