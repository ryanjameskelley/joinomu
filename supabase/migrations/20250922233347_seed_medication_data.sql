-- Sample medication catalog data
-- Insert medications for weight loss and men's health categories

-- Weight Loss Medications
INSERT INTO medications (name, generic_name, brand_name, dosage_form, strength, description, category, unit_price, requires_prescription, active) VALUES
('Semaglutide', 'Semaglutide', 'Ozempic', 'injection', '0.5mg', 'GLP-1 receptor agonist for weight management and diabetes', 'weight_loss', 899.99, true, true),
('Semaglutide', 'Semaglutide', 'Wegovy', 'injection', '1.0mg', 'GLP-1 receptor agonist specifically for chronic weight management', 'weight_loss', 1299.99, true, true),
('Tirzepatide', 'Tirzepatide', 'Mounjaro', 'injection', '2.5mg', 'Dual GIP/GLP-1 receptor agonist for weight loss', 'weight_loss', 1199.99, true, true),
('Liraglutide', 'Liraglutide', 'Saxenda', 'injection', '3.0mg', 'GLP-1 receptor agonist for weight management', 'weight_loss', 1099.99, true, true),
('Orlistat', 'Orlistat', 'Xenical', 'capsule', '120mg', 'Lipase inhibitor for weight loss', 'weight_loss', 199.99, true, true),
('Phentermine', 'Phentermine', 'Adipex-P', 'tablet', '37.5mg', 'Appetite suppressant for short-term weight loss', 'weight_loss', 89.99, true, true);

-- Men's Health Medications
INSERT INTO medications (name, generic_name, brand_name, dosage_form, strength, description, category, unit_price, requires_prescription, active) VALUES
('Testosterone Cypionate', 'Testosterone Cypionate', 'Depo-Testosterone', 'injection', '200mg/ml', 'Testosterone replacement therapy for hypogonadism', 'mens_health', 199.99, true, true),
('Testosterone Enanthate', 'Testosterone Enanthate', 'Delatestryl', 'injection', '250mg/ml', 'Long-acting testosterone for hormone replacement', 'mens_health', 219.99, true, true),
('Testosterone Gel', 'Testosterone', 'AndroGel', 'gel', '1.62%', 'Topical testosterone replacement therapy', 'mens_health', 299.99, true, true),
('Sildenafil', 'Sildenafil', 'Viagra', 'tablet', '50mg', 'PDE5 inhibitor for erectile dysfunction', 'mens_health', 89.99, true, true),
('Tadalafil', 'Tadalafil', 'Cialis', 'tablet', '20mg', 'Long-acting PDE5 inhibitor for erectile dysfunction', 'mens_health', 99.99, true, true),
('Finasteride', 'Finasteride', 'Propecia', 'tablet', '1mg', '5-alpha reductase inhibitor for male pattern baldness', 'mens_health', 79.99, true, true),
('HCG', 'Human Chorionic Gonadotropin', 'Pregnyl', 'injection', '5000 IU', 'Hormone therapy to support testosterone production', 'mens_health', 149.99, true, true);

-- Sample patient medication preferences
-- Get some patient IDs first (only add if patients exist)
DO $$
DECLARE
    patient_ids UUID[] := ARRAY(SELECT id FROM patients LIMIT 5);
    medication_ids UUID[] := ARRAY(SELECT id FROM medications WHERE category = 'weight_loss' LIMIT 3);
    mens_medication_ids UUID[] := ARRAY(SELECT id FROM medications WHERE category = 'mens_health' LIMIT 2);
    i INTEGER;
BEGIN
    -- Only proceed if we have patients and medications
    IF array_length(patient_ids, 1) > 0 AND array_length(medication_ids, 1) > 0 THEN
        -- Add weight loss preferences for first 3 patients
        FOR i IN 1..LEAST(3, array_length(patient_ids, 1))
        LOOP
            -- Each patient prefers 1-2 weight loss medications
            INSERT INTO patient_medication_preferences (patient_id, medication_id, preferred_dosage, frequency, notes, status)
            VALUES 
                (patient_ids[i], medication_ids[1], '0.5mg', 'weekly', 'Patient interested in starting with lower dose', 'pending'),
                (patient_ids[i], medication_ids[2], '1.0mg', 'weekly', 'Considering higher dose option', 'pending');
        END LOOP;

        -- Add men's health preferences for last 2 patients
        IF array_length(mens_medication_ids, 1) > 0 THEN
            FOR i IN GREATEST(1, array_length(patient_ids, 1) - 1)..array_length(patient_ids, 1)
            LOOP
                INSERT INTO patient_medication_preferences (patient_id, medication_id, preferred_dosage, frequency, notes, status)
                VALUES 
                    (patient_ids[i], mens_medication_ids[1], '200mg', 'bi-weekly', 'Looking for testosterone replacement therapy', 'pending');
            END LOOP;
        END IF;
    END IF;
END $$;

-- Sample medication approvals from providers
DO $$
DECLARE
    preference_record RECORD;
    provider_ids UUID[] := ARRAY(SELECT id FROM providers LIMIT 2);
BEGIN
    -- Approve some medication preferences
    FOR preference_record IN 
        SELECT id, patient_id, medication_id FROM patient_medication_preferences 
        WHERE status = 'pending' 
        LIMIT 4
    LOOP
        INSERT INTO medication_approvals (
            preference_id, 
            provider_id, 
            status, 
            approved_dosage, 
            approved_frequency, 
            provider_notes, 
            approval_date
        ) VALUES (
            preference_record.id,
            provider_ids[1], -- Use first provider
            CASE 
                WHEN random() > 0.2 THEN 'approved'
                ELSE 'needs_review'
            END,
            'As requested',
            'As requested',
            'Standard approval based on patient profile',
            CASE 
                WHEN random() > 0.2 THEN now()
                ELSE NULL
            END
        );
    END LOOP;
END $$;

-- Sample medication orders for approved items
DO $$
DECLARE
    approval_record RECORD;
BEGIN
    FOR approval_record IN 
        SELECT ma.id as approval_id, ma.preference_id, pmp.patient_id, pmp.medication_id, m.unit_price
        FROM medication_approvals ma
        JOIN patient_medication_preferences pmp ON ma.preference_id = pmp.id
        JOIN medications m ON pmp.medication_id = m.id
        WHERE ma.status = 'approved'
        LIMIT 3
    LOOP
        INSERT INTO medication_orders (
            approval_id,
            patient_id,
            medication_id,
            quantity,
            unit_price,
            total_amount,
            payment_status,
            fulfillment_status
        ) VALUES (
            approval_record.approval_id,
            approval_record.patient_id,
            approval_record.medication_id,
            1,
            approval_record.unit_price,
            approval_record.unit_price,
            CASE 
                WHEN random() > 0.3 THEN 'paid'
                ELSE 'pending'
            END,
            CASE 
                WHEN random() > 0.5 THEN 'processing'
                ELSE 'pending'
            END
        );
    END LOOP;
END $$;