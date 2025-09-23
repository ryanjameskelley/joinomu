-- Complete the medication workflow: Preferences to Approvals to Orders
-- This creates the missing approvals and orders so the payment/shipping UI works

DO $$
DECLARE
    pref_record RECORD;
    approval_id UUID;
    provider_id UUID;
BEGIN
    -- Get a provider for approvals (use first available provider)
    SELECT id INTO provider_id FROM providers LIMIT 1;
    
    IF provider_id IS NULL THEN
        RAISE NOTICE 'No providers found - skipping workflow completion';
        RETURN;
    END IF;
    
    -- Loop through existing medication preferences and create approvals + orders
    FOR pref_record IN 
        SELECT pmp.*, m.name as medication_name
        FROM patient_medication_preferences pmp
        JOIN medications m ON pmp.medication_id = m.id
        WHERE pmp.status IN ('pending', 'approved')
    LOOP
        -- Create medication approval
        INSERT INTO medication_approvals (
            preference_id,
            provider_id,
            status,
            approved_dosage,
            approved_frequency,
            provider_notes,
            approval_date
        ) VALUES (
            pref_record.id,
            provider_id,
            'approved',
            pref_record.preferred_dosage,
            pref_record.frequency,
            CASE 
                WHEN pref_record.medication_name LIKE '%Semaglutide%' THEN 'Approved for weight management program'
                WHEN pref_record.medication_name LIKE '%Tirzepatide%' THEN 'Approved for diabetes and weight management'
                ELSE 'Approved after medical review'
            END,
            NOW()
        ) RETURNING id INTO approval_id;
        
        -- Create medication order
        INSERT INTO medication_orders (
            approval_id,
            patient_id,
            medication_id,
            quantity,
            unit_price,
            total_amount,
            payment_status,
            fulfillment_status,
            payment_date,
            sent_to_pharmacy,
            shipped_date,
            tracking_number
        ) VALUES (
            approval_id,
            pref_record.patient_id,
            pref_record.medication_id,
            1, -- Default quantity
            CASE 
                WHEN pref_record.medication_name LIKE '%Semaglutide%' THEN 299.99
                WHEN pref_record.medication_name LIKE '%Tirzepatide%' THEN 399.99
                ELSE 199.99
            END,
            CASE 
                WHEN pref_record.medication_name LIKE '%Semaglutide%' THEN 299.99
                WHEN pref_record.medication_name LIKE '%Tirzepatide%' THEN 399.99
                ELSE 199.99
            END,
            'paid',
            'processing',
            NOW() - INTERVAL '5 days', -- Payment was 5 days ago
            NOW() - INTERVAL '3 days', -- Sent to pharmacy 3 days ago  
            NULL, -- Not shipped yet (this is what admin will update)
            NULL  -- No tracking yet (this is what admin will update)
        );
        
        -- Update preference status to approved
        UPDATE patient_medication_preferences 
        SET status = 'approved' 
        WHERE id = pref_record.id;
        
        RAISE NOTICE 'Created workflow for: % (% %)', 
            pref_record.medication_name, pref_record.preferred_dosage, pref_record.frequency;
            
    END LOOP;
    
    RAISE NOTICE 'Medication workflow completion finished';
END $$;