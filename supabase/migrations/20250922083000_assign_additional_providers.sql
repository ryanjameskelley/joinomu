-- Migration to assign patients to additional providers for testing

-- Create a simple log table if it doesn't exist first
CREATE TABLE IF NOT EXISTS assignment_log (
  id SERIAL PRIMARY KEY,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- First, let's see what providers and patients we have
INSERT INTO assignment_log (message) VALUES ('Starting provider assignment process');

-- Now let's assign patients to the other providers
-- Get the provider IDs for providers other than the heavily assigned one
DO $$
DECLARE
  provider_1_id UUID;
  provider_2_id UUID;
  patient_ids UUID[];
  patient_id UUID;
  assignment_count INTEGER := 0;
BEGIN
  -- Get provider IDs (excluding the heavily assigned one)
  SELECT id INTO provider_1_id 
  FROM providers 
  WHERE specialty NOT LIKE '%provider-test%'
  ORDER BY created_at 
  LIMIT 1;
  
  SELECT id INTO provider_2_id 
  FROM providers 
  WHERE specialty NOT LIKE '%provider-test%'
  AND id != provider_1_id
  ORDER BY created_at 
  LIMIT 1 OFFSET 1;
  
  -- Get patient IDs
  SELECT ARRAY(SELECT id FROM patients ORDER BY created_at LIMIT 6) INTO patient_ids;
  
  -- Assign first 3 patients to provider_1 if we have one
  IF provider_1_id IS NOT NULL THEN
    FOREACH patient_id IN ARRAY patient_ids[1:3]
    LOOP
      INSERT INTO patient_assignments (provider_id, patient_id, treatment_type, assigned_date, is_primary)
      VALUES (provider_1_id, patient_id, 'weight_loss', CURRENT_DATE, false)
      ON CONFLICT (provider_id, patient_id) DO NOTHING;
      assignment_count := assignment_count + 1;
    END LOOP;
  END IF;
  
  -- Assign next 3 patients to provider_2 if we have one
  IF provider_2_id IS NOT NULL THEN
    FOREACH patient_id IN ARRAY patient_ids[4:6]
    LOOP
      INSERT INTO patient_assignments (provider_id, patient_id, treatment_type, assigned_date, is_primary)
      VALUES (provider_2_id, patient_id, 'mens_health', CURRENT_DATE, false)
      ON CONFLICT (provider_id, patient_id) DO NOTHING;
      assignment_count := assignment_count + 1;
    END LOOP;
  END IF;
  
  RAISE NOTICE 'Assigned % patients to providers % and %', assignment_count, provider_1_id, provider_2_id;
END $$;

-- Log the completion
INSERT INTO assignment_log (message) VALUES ('Provider assignment process completed');