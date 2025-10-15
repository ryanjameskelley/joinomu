-- Create sample patients, providers, and assign medications
-- This script will create the full workflow from patient preferences to orders

-- First, let's create some sample patients, admins, and providers
INSERT INTO profiles (id, first_name, last_name, email) VALUES 
-- Patients
('11111111-1111-1111-1111-111111111111', 'Sarah', 'Johnson', 'sarah@example.com'),
('22222222-2222-2222-2222-222222222222', 'Michael', 'Roberts', 'michael@example.com'),
('33333333-3333-3333-3333-333333333333', 'Jennifer', 'Martinez', 'jennifer@example.com'),
('44444444-4444-4444-4444-444444444444', 'David', 'Anderson', 'david@example.com'),
-- Admin
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Admin', 'User', 'admin@example.com'),
-- Providers
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Dr. Emily', 'Watson', 'dr.watson@example.com'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Dr. James', 'Wilson', 'dr.wilson@example.com')
ON CONFLICT (id) DO NOTHING;

-- Create patient records
INSERT INTO patients (id, profile_id, phone, has_completed_intake) VALUES 
('p1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '555-0101', true),
('p2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '555-0102', true),
('p3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '555-0103', true),
('p4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '555-0104', true)
ON CONFLICT (id) DO NOTHING;

-- Create admin record
INSERT INTO admins (id, profile_id, permissions) VALUES 
('a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ARRAY['all'])
ON CONFLICT (id) DO NOTHING;

-- Create provider records
INSERT INTO providers (id, profile_id, specialty, license_number, phone, active) VALUES 
('prov1111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Endocrinology', 'LIC001', '555-0201', true),
('prov2222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Men\'s Health', 'LIC002', '555-0202', true)
ON CONFLICT (id) DO NOTHING;

-- Assign patients to providers
INSERT INTO patient_assignments (provider_id, patient_id, treatment_type, assigned_date, is_primary) VALUES 
-- Dr. Watson gets weight loss patients
('prov1111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'weight_loss', CURRENT_DATE, true),
('prov1111-1111-1111-1111-111111111111', 'p2222222-2222-2222-2222-222222222222', 'weight_loss', CURRENT_DATE, true),
-- Dr. Wilson gets men's health patients
('prov2222-2222-2222-2222-222222222222', 'p3333333-3333-3333-3333-333333333333', 'mens_health', CURRENT_DATE, true),
('prov2222-2222-2222-2222-222222222222', 'p4444444-4444-4444-4444-444444444444', 'mens_health', CURRENT_DATE, true)
ON CONFLICT (provider_id, patient_id) DO NOTHING;

-- Now let's assign medications to patients
DO $$
DECLARE
    -- Weight loss medications
    semaglutide_id UUID := (SELECT id FROM medications WHERE name = 'Semaglutide' AND strength = '0.5mg' LIMIT 1);
    wegovy_id UUID := (SELECT id FROM medications WHERE name = 'Semaglutide' AND strength = '1.0mg' LIMIT 1);
    tirzepatide_id UUID := (SELECT id FROM medications WHERE name = 'Tirzepatide' LIMIT 1);
    
    -- Men's health medications
    testosterone_id UUID := (SELECT id FROM medications WHERE name = 'Testosterone Cypionate' LIMIT 1);
    sildenafil_id UUID := (SELECT id FROM medications WHERE name = 'Sildenafil' LIMIT 1);
    
    -- Provider IDs
    dr_watson_id UUID := 'prov1111-1111-1111-1111-111111111111';
    dr_wilson_id UUID := 'prov2222-2222-2222-2222-222222222222';
    
    -- Preference and approval IDs for tracking
    pref_id UUID;
    approval_id UUID;
BEGIN
    -- Sarah Johnson (Weight Loss) - Semaglutide
    INSERT INTO patient_medication_preferences (patient_id, medication_id, preferred_dosage, frequency, notes, status)
    VALUES ('p1111111-1111-1111-1111-111111111111', semaglutide_id, '0.5mg', 'weekly', 'Starting with lower dose for weight management', 'pending')
    RETURNING id INTO pref_id;
    
    INSERT INTO medication_approvals (preference_id, provider_id, status, approved_dosage, approved_frequency, provider_notes, approval_date)
    VALUES (pref_id, dr_watson_id, 'approved', '0.5mg', 'weekly', 'Approved for weight management program', now())
    RETURNING id INTO approval_id;
    
    INSERT INTO medication_orders (approval_id, patient_id, medication_id, quantity, unit_price, total_amount, payment_status, fulfillment_status)
    VALUES (approval_id, 'p1111111-1111-1111-1111-111111111111', semaglutide_id, 1, 899.99, 899.99, 'paid', 'processing');

    -- Michael Roberts (Weight Loss) - Wegovy
    INSERT INTO patient_medication_preferences (patient_id, medication_id, preferred_dosage, frequency, notes, status)
    VALUES ('p2222222-2222-2222-2222-222222222222', wegovy_id, '1.0mg', 'weekly', 'Higher dose for aggressive weight loss', 'pending')
    RETURNING id INTO pref_id;
    
    INSERT INTO medication_approvals (preference_id, provider_id, status, approved_dosage, approved_frequency, provider_notes, approval_date)
    VALUES (pref_id, dr_watson_id, 'approved', '1.0mg', 'weekly', 'Patient suitable for higher dose', now())
    RETURNING id INTO approval_id;
    
    INSERT INTO medication_orders (approval_id, patient_id, medication_id, quantity, unit_price, total_amount, payment_status, fulfillment_status)
    VALUES (approval_id, 'p2222222-2222-2222-2222-222222222222', wegovy_id, 1, 1299.99, 1299.99, 'paid', 'shipped');

    -- Jennifer Martinez (Men's Health) - Testosterone
    INSERT INTO patient_medication_preferences (patient_id, medication_id, preferred_dosage, frequency, notes, status)
    VALUES ('p3333333-3333-3333-3333-333333333333', testosterone_id, '200mg', 'bi-weekly', 'Testosterone replacement therapy', 'pending')
    RETURNING id INTO pref_id;
    
    INSERT INTO medication_approvals (preference_id, provider_id, status, approved_dosage, approved_frequency, provider_notes, approval_date)
    VALUES (pref_id, dr_wilson_id, 'approved', '200mg', 'bi-weekly', 'TRT approved after lab review', now())
    RETURNING id INTO approval_id;
    
    INSERT INTO medication_orders (approval_id, patient_id, medication_id, quantity, unit_price, total_amount, payment_status, fulfillment_status, tracking_number)
    VALUES (approval_id, 'p3333333-3333-3333-3333-333333333333', testosterone_id, 1, 199.99, 199.99, 'paid', 'shipped', 'TRK123456789');

    -- David Anderson (Men's Health) - Pending approval
    INSERT INTO patient_medication_preferences (patient_id, medication_id, preferred_dosage, frequency, notes, status)
    VALUES ('p4444444-4444-4444-4444-444444444444', sildenafil_id, '50mg', 'as_needed', 'ED treatment request', 'pending')
    RETURNING id INTO pref_id;
    
    INSERT INTO medication_approvals (preference_id, provider_id, status, provider_notes)
    VALUES (pref_id, dr_wilson_id, 'needs_review', 'Awaiting additional consultation');

    RAISE NOTICE 'Successfully assigned medications to 4 patients with various workflow states';
END $$;