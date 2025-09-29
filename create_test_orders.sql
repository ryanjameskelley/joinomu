-- Create test medication orders for testing the admin interface
BEGIN;

-- First get some existing data
DO $$
DECLARE
    test_patient_id UUID;
    test_medication_id UUID;
    test_approval_id UUID;
    test_preference_id UUID;
BEGIN
    -- Get first patient
    SELECT id INTO test_patient_id FROM patients LIMIT 1;
    
    -- Get first medication
    SELECT id INTO test_medication_id FROM medications LIMIT 1;
    
    IF test_patient_id IS NOT NULL AND test_medication_id IS NOT NULL THEN
        -- Create or get a medication preference
        INSERT INTO patient_medication_preferences (
            patient_id, medication_id, preferred_dosage, frequency, status
        )
        VALUES (
            test_patient_id, test_medication_id, '1mg', 'weekly', 'approved'
        )
        ON CONFLICT (patient_id, medication_id) 
        DO UPDATE SET status = 'approved', preferred_dosage = '1mg', frequency = 'weekly'
        RETURNING id INTO test_preference_id;
        
        -- Create or get an approval
        INSERT INTO medication_approvals (
            preference_id, 
            provider_id, 
            status, 
            approved_dosage, 
            approved_frequency, 
            approval_date
        )
        SELECT 
            test_preference_id,
            p.id,
            'approved',
            '1mg',
            'weekly',
            NOW()
        FROM providers p LIMIT 1
        ON CONFLICT DO NOTHING
        RETURNING id INTO test_approval_id;
        
        -- Get the approval ID if it already exists
        IF test_approval_id IS NULL THEN
            SELECT ma.id INTO test_approval_id 
            FROM medication_approvals ma 
            WHERE ma.preference_id = test_preference_id 
            LIMIT 1;
        END IF;
        
        -- Create test medication orders if approval exists
        IF test_approval_id IS NOT NULL THEN
            INSERT INTO medication_orders (
                approval_id,
                patient_id,
                medication_id,
                quantity,
                unit_price,
                total_amount,
                payment_status,
                payment_method,
                payment_date,
                fulfillment_status,
                tracking_number,
                shipped_date,
                estimated_delivery,
                admin_notes
            )
            VALUES 
            (
                test_approval_id,
                test_patient_id,
                test_medication_id,
                30, -- 30 day supply
                89.99,
                89.99,
                'paid',
                'credit_card',
                NOW() - INTERVAL '3 days',
                'shipped',
                '1Z999AA1234567890',
                NOW() - INTERVAL '1 day',
                NOW() + INTERVAL '2 days',
                'Standard shipping, signature required'
            ),
            (
                test_approval_id,
                test_patient_id,
                test_medication_id,
                30, -- 30 day supply
                89.99,
                89.99,
                'pending',
                NULL,
                NULL,
                'pending',
                NULL,
                NULL,
                NULL,
                'Awaiting payment confirmation'
            )
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Created test medication orders for patient % with medication %', test_patient_id, test_medication_id;
        ELSE
            RAISE NOTICE 'Could not create approval - no providers found';
        END IF;
    ELSE
        RAISE NOTICE 'Could not create test data - missing patients or medications';
    END IF;
END;
$$;

COMMIT;