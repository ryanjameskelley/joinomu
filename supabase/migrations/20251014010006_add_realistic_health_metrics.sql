-- Add realistic health metrics data for patient with auth_id 6a2ffaa8-318b-4888-a102-1277708d6b9a
-- Patient ID: 419d8930-528f-4b7c-a2b0-3c62227c6bec

-- Insert realistic health metrics data for the last 60 days
DO $$
DECLARE
    patient_uuid UUID := '419d8930-528f-4b7c-a2b0-3c62227c6bec';
    current_date DATE := CURRENT_DATE;
    i INTEGER;
    random_offset FLOAT;
    metric_rec RECORD;
BEGIN
    -- Clear any existing data for this patient to avoid duplicates
    DELETE FROM patient_health_metrics WHERE patient_id = patient_uuid;
    
    RAISE NOTICE 'Adding realistic health metrics for patient %', patient_uuid;
    
    -- Loop through the last 60 days
    FOR i IN 0..59 LOOP
        -- Skip some days randomly (70% chance of having data)
        IF random() < 0.7 THEN
            
            -- Weight (gradual decrease from 200 to 195 lbs over 60 days)
            INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
            VALUES (
                patient_uuid, 
                'weight', 
                200 - (i * 0.083) + (random() - 0.5) * 2, -- Gradual decrease with some variation
                'lbs',
                (current_date - i * INTERVAL '1 day') + (random() * INTERVAL '12 hours'),
                'manual'
            );
            
            -- Steps (8000-15000 per day, lower on weekends)
            random_offset := CASE 
                WHEN EXTRACT(DOW FROM current_date - i * INTERVAL '1 day') IN (0, 6) 
                THEN 6000 + random() * 4000  -- Weekend: 6000-10000 steps
                ELSE 8000 + random() * 7000  -- Weekday: 8000-15000 steps
            END;
            INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
            VALUES (
                patient_uuid,
                'steps',
                random_offset,
                'steps',
                (current_date - i * INTERVAL '1 day') + (random() * INTERVAL '12 hours'),
                'healthkit'
            );
            
            -- Sleep (6.5-9 hours per night)
            INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
            VALUES (
                patient_uuid,
                'sleep',
                6.5 + random() * 2.5,
                'hours',
                (current_date - i * INTERVAL '1 day') + INTERVAL '7 hours', -- Morning recording
                'healthkit'
            );
            
            -- Calories (2000-2800 per day)
            INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
            VALUES (
                patient_uuid,
                'calories',
                2000 + random() * 800,
                'kcal',
                (current_date - i * INTERVAL '1 day') + (random() * INTERVAL '12 hours'),
                'manual'
            );
            
            -- Protein (80-140 grams per day)
            INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
            VALUES (
                patient_uuid,
                'protein',
                80 + random() * 60,
                'grams',
                (current_date - i * INTERVAL '1 day') + (random() * INTERVAL '12 hours'),
                'manual'
            );
            
            -- Sugar (25-65 grams per day)
            INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
            VALUES (
                patient_uuid,
                'sugar',
                25 + random() * 40,
                'grams',
                (current_date - i * INTERVAL '1 day') + (random() * INTERVAL '12 hours'),
                'manual'
            );
            
            -- Heart Rate (65-85 bpm average)
            INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
            VALUES (
                patient_uuid,
                'heart_rate',
                65 + random() * 20,
                'bpm',
                (current_date - i * INTERVAL '1 day') + (random() * INTERVAL '12 hours'),
                'healthkit'
            );
            
        END IF;
    END LOOP;
    
    -- Report what was created
    FOR metric_rec IN (SELECT metric_type, COUNT(*) as count FROM patient_health_metrics WHERE patient_id = patient_uuid GROUP BY metric_type ORDER BY metric_type) LOOP
        RAISE NOTICE 'Added % records for %', metric_rec.count, metric_rec.metric_type;
    END LOOP;
    
    RAISE NOTICE '✅ SUCCESS: Realistic health metrics data added for patient %', patient_uuid;
    
END $$;