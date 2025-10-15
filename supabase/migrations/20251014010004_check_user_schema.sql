-- Check the actual schema of providers and patients tables

-- Check providers table
DO $$
DECLARE
    provider_count integer;
    provider_rec RECORD;
BEGIN
    RAISE NOTICE '=== PROVIDERS TABLE SCHEMA CHECK ===';
    
    SELECT COUNT(*) INTO provider_count FROM providers;
    RAISE NOTICE 'Total providers: %', provider_count;
    
    IF provider_count > 0 THEN
        RAISE NOTICE '=== SAMPLE PROVIDERS ===';
        FOR provider_rec IN (
            SELECT profile_id, id FROM providers ORDER BY created_at DESC LIMIT 5
        ) LOOP
            RAISE NOTICE 'Provider: profile_id=%, id=%', provider_rec.profile_id, provider_rec.id;
        END LOOP;
    END IF;
END $$;

-- Check patients table
DO $$
DECLARE
    patient_count integer;
    patient_rec RECORD;
BEGIN
    RAISE NOTICE '=== PATIENTS TABLE SCHEMA CHECK ===';
    
    SELECT COUNT(*) INTO patient_count FROM patients;
    RAISE NOTICE 'Total patients: %', patient_count;
    
    IF patient_count > 0 THEN
        RAISE NOTICE '=== SAMPLE PATIENTS ===';
        FOR patient_rec IN (
            SELECT profile_id, id FROM patients ORDER BY created_at DESC LIMIT 5
        ) LOOP
            RAISE NOTICE 'Patient: profile_id=%, id=%', patient_rec.profile_id, patient_rec.id;
        END LOOP;
    END IF;
END $$;