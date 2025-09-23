-- Add sample patient medication preferences to show medications in admin table
-- This follows the correct workflow: patients select preferences first

DO $$
DECLARE
    patient_ids UUID[] := ARRAY(SELECT id FROM patients ORDER BY created_at);
    med_ids UUID[] := ARRAY(SELECT id FROM medications ORDER BY created_at);
BEGIN
    -- Only proceed if we have patients and medications
    IF array_length(patient_ids, 1) >= 4 AND array_length(med_ids, 1) >= 3 THEN
        
        -- Sarah Johnson - Semaglutide preference
        INSERT INTO patient_medication_preferences (
            patient_id, 
            medication_id, 
            preferred_dosage, 
            frequency, 
            notes, 
            status
        ) VALUES (
            patient_ids[1], 
            med_ids[1], 
            '0.5mg', 
            'weekly', 
            'Starting dose for weight management', 
            'pending'
        );
        
        -- Michael Roberts - Ozempic preference
        INSERT INTO patient_medication_preferences (
            patient_id, 
            medication_id, 
            preferred_dosage, 
            frequency, 
            notes, 
            status
        ) VALUES (
            patient_ids[2], 
            med_ids[2], 
            '1.0mg', 
            'weekly', 
            'Higher dose for weight loss', 
            'approved'
        );
        
        -- Jennifer Martinez - Wegovy preference  
        INSERT INTO patient_medication_preferences (
            patient_id, 
            medication_id, 
            preferred_dosage, 
            frequency, 
            notes, 
            status
        ) VALUES (
            patient_ids[3], 
            med_ids[3], 
            '2.4mg', 
            'weekly', 
            'Max dose for significant weight loss', 
            'approved'
        );
        
        -- David Anderson - Multiple preferences
        INSERT INTO patient_medication_preferences (
            patient_id, 
            medication_id, 
            preferred_dosage, 
            frequency, 
            notes, 
            status
        ) VALUES (
            patient_ids[4], 
            med_ids[1], 
            '0.25mg', 
            'weekly', 
            'Starting with lowest dose', 
            'pending'
        );
        
        RAISE NOTICE 'Successfully created patient medication preferences';
    ELSE
        RAISE NOTICE 'Skipping medication preferences - missing patients or medications';
    END IF;
END $$;