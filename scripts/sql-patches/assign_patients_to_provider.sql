-- Find the provider ID for user_id 9bc6ae5e-d528-411b-975a-b2346519dbb5
SELECT id as provider_id, first_name, last_name 
FROM providers 
WHERE user_id = '9bc6ae5e-d528-411b-975a-b2346519dbb5';

-- Show available patients
SELECT id as patient_id, first_name, last_name, email 
FROM patients 
LIMIT 10;

-- Show existing patient-provider relationships
SELECT pp.*, 
       p.first_name || ' ' || p.last_name as patient_name,
       pr.first_name || ' ' || pr.last_name as provider_name
FROM patient_providers pp
JOIN patients p ON pp.patient_id = p.id
JOIN providers pr ON pp.provider_id = pr.id;

-- Assign the first 5 patients to the provider (assuming provider ID is found above)
-- You'll need to replace 'PROVIDER_ID_HERE' with the actual provider ID from the first query

-- Example assignments (uncomment and modify with actual IDs):
/*
INSERT INTO patient_providers (patient_id, provider_id, treatment_type, is_primary, assigned_date)
SELECT 
    p.id as patient_id,
    'PROVIDER_ID_HERE' as provider_id,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY p.id) % 2 = 1 THEN 'weight_loss'
        ELSE 'mens_health'
    END as treatment_type,
    true as is_primary,
    CURRENT_DATE as assigned_date
FROM patients p
LIMIT 5;
*/