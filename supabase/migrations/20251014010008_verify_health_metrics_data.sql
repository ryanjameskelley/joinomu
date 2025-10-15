-- Verify health metrics data in the database
-- Check if data exists for patient 419d8930-528f-4b7c-a2b0-3c62227c6bec

DO $$
DECLARE
    patient_uuid UUID := '419d8930-528f-4b7c-a2b0-3c62227c6bec';
    total_count INTEGER;
    metric_rec RECORD;
BEGIN
    RAISE NOTICE '=== HEALTH METRICS DATA VERIFICATION ===';
    RAISE NOTICE 'Checking for patient: %', patient_uuid;
    
    -- Check if patient exists
    IF EXISTS (SELECT 1 FROM patients WHERE id = patient_uuid) THEN
        RAISE NOTICE '✅ Patient exists in patients table';
    ELSE
        RAISE WARNING '❌ Patient does not exist in patients table';
    END IF;
    
    -- Count total health metrics for this patient
    SELECT COUNT(*) INTO total_count FROM patient_health_metrics WHERE patient_id = patient_uuid;
    RAISE NOTICE 'Total health metrics records: %', total_count;
    
    -- If no records, check if table exists and has any data at all
    IF total_count = 0 THEN
        SELECT COUNT(*) INTO total_count FROM patient_health_metrics;
        RAISE NOTICE 'Total records in patient_health_metrics table: %', total_count;
        
        -- Show all patient IDs that have data
        RAISE NOTICE '=== PATIENTS WITH HEALTH METRICS DATA ===';
        FOR metric_rec IN (
            SELECT DISTINCT patient_id, COUNT(*) as record_count
            FROM patient_health_metrics 
            GROUP BY patient_id 
            ORDER BY record_count DESC 
            LIMIT 10
        ) LOOP
            RAISE NOTICE 'Patient ID: % has % records', metric_rec.patient_id, metric_rec.record_count;
        END LOOP;
    ELSE
        -- Show breakdown by metric type for our patient
        RAISE NOTICE '=== METRICS BREAKDOWN FOR PATIENT % ===', patient_uuid;
        FOR metric_rec IN (
            SELECT metric_type, COUNT(*) as count, 
                   MIN(recorded_at) as earliest, 
                   MAX(recorded_at) as latest
            FROM patient_health_metrics 
            WHERE patient_id = patient_uuid 
            GROUP BY metric_type 
            ORDER BY count DESC
        ) LOOP
            RAISE NOTICE '% records for % (% to %)', 
                        metric_rec.count, 
                        metric_rec.metric_type,
                        metric_rec.earliest::DATE,
                        metric_rec.latest::DATE;
        END LOOP;
    END IF;
    
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
END $$;