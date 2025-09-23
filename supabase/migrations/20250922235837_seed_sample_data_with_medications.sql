-- Create sample data with medication workflows
-- This will populate the database with realistic test data

-- Create auth.users entries (which will trigger profile creation)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) VALUES 
('11111111-1111-1111-1111-111111111111', 'sarah.j@test.com', '$2a$10$dummyhashforsarahjohnson', now(), now(), now()),
('22222222-2222-2222-2222-222222222222', 'michael.r@test.com', '$2a$10$dummyhashformichaelroberts', now(), now(), now()),
('33333333-3333-3333-3333-333333333333', 'jennifer.m@test.com', '$2a$10$dummyhashforjennifermartinez', now(), now(), now()),
('44444444-4444-4444-4444-444444444444', 'david.a@test.com', '$2a$10$dummyhashfordavidanderson', now(), now(), now()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@test.com', '$2a$10$dummyhashforadminuser', now(), now(), now()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dr.watson@test.com', '$2a$10$dummyhashfordrwatson', now(), now(), now()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dr.wilson@test.com', '$2a$10$dummyhashfordrwilson', now(), now(), now());

-- Update the profiles created by the trigger with names and roles
UPDATE profiles SET 
  first_name = 'Sarah', 
  last_name = 'Johnson', 
  role = 'patient' 
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE profiles SET 
  first_name = 'Michael', 
  last_name = 'Roberts', 
  role = 'patient' 
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE profiles SET 
  first_name = 'Jennifer', 
  last_name = 'Martinez', 
  role = 'patient' 
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE profiles SET 
  first_name = 'David', 
  last_name = 'Anderson', 
  role = 'patient' 
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE profiles SET 
  first_name = 'Admin', 
  last_name = 'User', 
  role = 'admin' 
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE profiles SET 
  first_name = 'Dr. Emily', 
  last_name = 'Watson', 
  role = 'provider' 
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE profiles SET 
  first_name = 'Dr. James', 
  last_name = 'Wilson', 
  role = 'provider' 
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Update patient records created by trigger
UPDATE patients SET 
  phone = '555-0101', 
  has_completed_intake = true 
WHERE profile_id = '11111111-1111-1111-1111-111111111111';

UPDATE patients SET 
  phone = '555-0102', 
  has_completed_intake = true 
WHERE profile_id = '22222222-2222-2222-2222-222222222222';

UPDATE patients SET 
  phone = '555-0103', 
  has_completed_intake = true 
WHERE profile_id = '33333333-3333-3333-3333-333333333333';

UPDATE patients SET 
  phone = '555-0104', 
  has_completed_intake = true 
WHERE profile_id = '44444444-4444-4444-4444-444444444444';

-- Update admin record created by trigger
UPDATE admins SET 
  permissions = ARRAY['all'] 
WHERE profile_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Update provider records created by trigger
UPDATE providers SET 
  specialty = 'Endocrinology', 
  license_number = 'LIC001', 
  phone = '555-0201', 
  active = true 
WHERE profile_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE providers SET 
  specialty = 'Men''s Health', 
  license_number = 'LIC002', 
  phone = '555-0202', 
  active = true 
WHERE profile_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Assign patients to providers (only if both exist)
DO $$
DECLARE
    patient_ids UUID[] := ARRAY(SELECT id FROM patients ORDER BY created_at);
    provider_ids UUID[] := ARRAY(SELECT id FROM providers ORDER BY created_at);
    dr_watson_id UUID;
    dr_wilson_id UUID;
BEGIN
    -- Get specific provider IDs
    SELECT id INTO dr_watson_id FROM providers WHERE specialty = 'Endocrinology' LIMIT 1;
    SELECT id INTO dr_wilson_id FROM providers WHERE specialty = 'Men''s Health' LIMIT 1;
    
    -- Only proceed if we have patients and providers
    IF array_length(patient_ids, 1) >= 4 AND dr_watson_id IS NOT NULL AND dr_wilson_id IS NOT NULL THEN
        -- Dr. Watson (Endocrinology) gets weight loss patients
        INSERT INTO patient_assignments (provider_id, patient_id, treatment_type, assigned_date, is_primary) VALUES 
        (dr_watson_id, patient_ids[1], 'weight_loss', CURRENT_DATE, true),
        (dr_watson_id, patient_ids[2], 'weight_loss', CURRENT_DATE, true);
        
        -- Dr. Wilson (Men's Health) gets men's health patients
        INSERT INTO patient_assignments (provider_id, patient_id, treatment_type, assigned_date, is_primary) VALUES 
        (dr_wilson_id, patient_ids[3], 'mens_health', CURRENT_DATE, true),
        (dr_wilson_id, patient_ids[4], 'mens_health', CURRENT_DATE, true);
        
        RAISE NOTICE 'Successfully assigned patients to providers';
    ELSE
        RAISE NOTICE 'Skipping patient assignments - missing patients or providers';
    END IF;
END $$;

-- Create complete medication workflows
DO $$
DECLARE
    -- Get IDs
    patient_ids UUID[] := ARRAY(SELECT id FROM patients ORDER BY created_at);
    dr_watson_id UUID;
    dr_wilson_id UUID;
    
    -- Get medication IDs
    semaglutide_id UUID := (SELECT id FROM medications WHERE name = 'Semaglutide' AND strength = '0.5mg' LIMIT 1);
    wegovy_id UUID := (SELECT id FROM medications WHERE name = 'Semaglutide' AND strength = '1.0mg' LIMIT 1);
    testosterone_id UUID := (SELECT id FROM medications WHERE name = 'Testosterone Cypionate' LIMIT 1);
    sildenafil_id UUID := (SELECT id FROM medications WHERE name = 'Sildenafil' LIMIT 1);
    
    -- Variables for workflow creation
    pref_id UUID;
    approval_id UUID;
BEGIN
    -- Get specific provider IDs
    SELECT id INTO dr_watson_id FROM providers WHERE specialty = 'Endocrinology' LIMIT 1;
    SELECT id INTO dr_wilson_id FROM providers WHERE specialty = 'Men''s Health' LIMIT 1;
    
    -- Only proceed if we have all necessary data
    IF array_length(patient_ids, 1) >= 4 AND dr_watson_id IS NOT NULL AND dr_wilson_id IS NOT NULL AND 
       semaglutide_id IS NOT NULL AND wegovy_id IS NOT NULL AND testosterone_id IS NOT NULL AND sildenafil_id IS NOT NULL THEN
    -- Workflow 1: Sarah Johnson - Semaglutide (Complete: Approved � Paid � Processing)
    INSERT INTO patient_medication_preferences (patient_id, medication_id, preferred_dosage, frequency, notes, status)
    VALUES (patient_ids[1], semaglutide_id, '0.5mg', 'weekly', 'Starting with lower dose for weight management', 'pending')
    RETURNING id INTO pref_id;
    
        INSERT INTO medication_approvals (preference_id, provider_id, status, approved_dosage, approved_frequency, provider_notes, approval_date)
        VALUES (pref_id, dr_watson_id, 'approved', '0.5mg', 'weekly', 'Approved for weight management program', now())
        RETURNING id INTO approval_id;
    
    INSERT INTO medication_orders (approval_id, patient_id, medication_id, quantity, unit_price, total_amount, payment_status, fulfillment_status)
    VALUES (approval_id, patient_ids[1], semaglutide_id, 1, 899.99, 899.99, 'paid', 'processing');

    -- Workflow 2: Michael Roberts - Wegovy (Complete: Approved � Paid � Shipped)
    INSERT INTO patient_medication_preferences (patient_id, medication_id, preferred_dosage, frequency, notes, status)
    VALUES (patient_ids[2], wegovy_id, '1.0mg', 'weekly', 'Higher dose for aggressive weight loss', 'pending')
    RETURNING id INTO pref_id;
    
    INSERT INTO medication_approvals (preference_id, provider_id, status, approved_dosage, approved_frequency, provider_notes, approval_date)
    VALUES (pref_id, dr_watson_id, 'approved', '1.0mg', 'weekly', 'Patient suitable for higher dose', now())
    RETURNING id INTO approval_id;
    
    INSERT INTO medication_orders (approval_id, patient_id, medication_id, quantity, unit_price, total_amount, payment_status, fulfillment_status)
    VALUES (approval_id, patient_ids[2], wegovy_id, 1, 1299.99, 1299.99, 'paid', 'shipped');

    -- Workflow 3: Jennifer Martinez - Testosterone (Complete: Approved � Paid � Shipped with tracking)
    INSERT INTO patient_medication_preferences (patient_id, medication_id, preferred_dosage, frequency, notes, status)
    VALUES (patient_ids[3], testosterone_id, '200mg', 'bi-weekly', 'Testosterone replacement therapy', 'pending')
    RETURNING id INTO pref_id;
    
    INSERT INTO medication_approvals (preference_id, provider_id, status, approved_dosage, approved_frequency, provider_notes, approval_date)
    VALUES (pref_id, dr_wilson_id, 'approved', '200mg', 'bi-weekly', 'TRT approved after lab review', now())
    RETURNING id INTO approval_id;
    
    INSERT INTO medication_orders (approval_id, patient_id, medication_id, quantity, unit_price, total_amount, payment_status, fulfillment_status, tracking_number)
    VALUES (approval_id, patient_ids[3], testosterone_id, 1, 199.99, 199.99, 'paid', 'shipped', 'TRK123456789');

    -- Workflow 4: David Anderson - Sildenafil (Pending approval)
    INSERT INTO patient_medication_preferences (patient_id, medication_id, preferred_dosage, frequency, notes, status)
    VALUES (patient_ids[4], sildenafil_id, '50mg', 'as_needed', 'ED treatment request', 'pending')
    RETURNING id INTO pref_id;
    
    INSERT INTO medication_approvals (preference_id, provider_id, status, provider_notes)
    VALUES (pref_id, dr_wilson_id, 'needs_review', 'Awaiting additional consultation');

        RAISE NOTICE 'Successfully created 4 complete medication workflows for testing';
    ELSE
        RAISE NOTICE 'Skipping medication workflows - missing required data';
    END IF;
END $$;