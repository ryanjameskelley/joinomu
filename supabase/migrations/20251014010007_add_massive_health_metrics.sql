-- Add massive realistic health metrics data for patient with auth_id 6a2ffaa8-318b-4888-a102-1277708d6b9a
-- Patient ID: 419d8930-528f-4b7c-a2b0-3c62227c6bec
-- This will add data for the last 365 days (1 year) with multiple entries per day for some metrics

DO $$
DECLARE
    patient_uuid UUID := '419d8930-528f-4b7c-a2b0-3c62227c6bec';
    current_date DATE := CURRENT_DATE;
    i INTEGER;
    j INTEGER;
    random_offset FLOAT;
    base_weight FLOAT := 205; -- Starting weight 1 year ago
    total_entries INTEGER := 0;
BEGIN
    -- Clear any existing data for this patient to avoid duplicates
    DELETE FROM patient_health_metrics WHERE patient_id = patient_uuid;
    
    RAISE NOTICE 'Adding massive realistic health metrics for patient % (365 days)', patient_uuid;
    
    -- Loop through the last 365 days (1 year)
    FOR i IN 0..364 LOOP
        -- Skip some days randomly (85% chance of having data - more consistent tracking)
        IF random() < 0.85 THEN
            
            -- Weight (gradual decrease from 205 to 195 lbs over 365 days, with plateaus and variations)
            -- Add some realistic weight loss patterns: initial drop, plateau, gradual loss
            DECLARE
                days_progress FLOAT := i::FLOAT / 364.0;
                weight_loss FLOAT;
            BEGIN
                -- Realistic weight loss curve: fast initial loss, then slower
                IF days_progress < 0.1 THEN
                    weight_loss := days_progress * 30; -- Quick initial 3lb loss in first month
                ELSIF days_progress < 0.4 THEN
                    weight_loss := 3 + (days_progress - 0.1) * 20; -- Slower 6lb loss over next 3 months
                ELSE
                    weight_loss := 9 + (days_progress - 0.4) * 2; -- Very slow 1lb loss over final 6 months
                END IF;
                
                INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
                VALUES (
                    patient_uuid, 
                    'weight', 
                    base_weight - weight_loss + (random() - 0.5) * 3, -- Daily variation of ±1.5 lbs
                    'lbs',
                    (current_date - i * INTERVAL '1 day') + TIME '07:30:00' + (random() * INTERVAL '1 hour'), -- Morning weigh-ins
                    'manual'
                );
                total_entries := total_entries + 1;
            END;
            
            -- Steps (Multiple entries per day: morning, afternoon, evening sync)
            FOR j IN 1..3 LOOP
                random_offset := CASE 
                    WHEN EXTRACT(DOW FROM current_date - i * INTERVAL '1 day') IN (0, 6) 
                    THEN 2000 + random() * 3000  -- Weekend: 2000-5000 steps per sync
                    ELSE 3000 + random() * 4000  -- Weekday: 3000-7000 steps per sync
                END;
                INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
                VALUES (
                    patient_uuid,
                    'steps',
                    random_offset,
                    'steps',
                    (current_date - i * INTERVAL '1 day') + (j * INTERVAL '6 hours') + (random() * INTERVAL '2 hours'),
                    'healthkit'
                );
                total_entries := total_entries + 1;
            END LOOP;
            
            -- Sleep (nightly tracking)
            INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
            VALUES (
                patient_uuid,
                'sleep',
                6.0 + random() * 3.5, -- 6.0-9.5 hours per night
                'hours',
                (current_date - i * INTERVAL '1 day') + TIME '08:00:00' + (random() * INTERVAL '2 hours'), -- Morning sleep summary
                'healthkit'
            );
            total_entries := total_entries + 1;
            
            -- Calories (2-3 entries per day: meals logged)
            FOR j IN 1..CASE WHEN random() > 0.3 THEN 3 ELSE 2 END LOOP
                INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
                VALUES (
                    patient_uuid,
                    'calories',
                    600 + random() * 1200, -- 600-1800 calories per meal/entry
                    'kcal',
                    (current_date - i * INTERVAL '1 day') + (j * INTERVAL '4 hours') + TIME '08:00:00' + (random() * INTERVAL '3 hours'),
                    'manual'
                );
                total_entries := total_entries + 1;
            END LOOP;
            
            -- Protein (2-3 entries per day: meal tracking)
            FOR j IN 1..CASE WHEN random() > 0.3 THEN 3 ELSE 2 END LOOP
                INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
                VALUES (
                    patient_uuid,
                    'protein',
                    15 + random() * 50, -- 15-65 grams per meal
                    'grams',
                    (current_date - i * INTERVAL '1 day') + (j * INTERVAL '4 hours') + TIME '08:00:00' + (random() * INTERVAL '3 hours'),
                    'manual'
                );
                total_entries := total_entries + 1;
            END LOOP;
            
            -- Sugar (2-4 entries per day: meal and snack tracking)
            FOR j IN 1..CASE WHEN random() > 0.5 THEN 4 WHEN random() > 0.2 THEN 3 ELSE 2 END LOOP
                INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
                VALUES (
                    patient_uuid,
                    'sugar',
                    5 + random() * 25, -- 5-30 grams per entry
                    'grams',
                    (current_date - i * INTERVAL '1 day') + (j * INTERVAL '3 hours') + TIME '08:00:00' + (random() * INTERVAL '2 hours'),
                    'manual'
                );
                total_entries := total_entries + 1;
            END LOOP;
            
            -- Heart Rate (Multiple readings throughout the day: resting, active, recovery)
            FOR j IN 1..CASE WHEN random() > 0.6 THEN 5 WHEN random() > 0.3 THEN 3 ELSE 2 END LOOP
                DECLARE
                    time_of_day FLOAT := j::FLOAT / 5.0; -- 0 to 1 representing day progression
                    base_hr INTEGER;
                BEGIN
                    -- Vary heart rate based on time of day
                    IF time_of_day < 0.2 THEN
                        base_hr := 60; -- Early morning resting HR
                    ELSIF time_of_day < 0.6 THEN
                        base_hr := 75; -- Active day HR
                    ELSIF time_of_day < 0.8 THEN
                        base_hr := 95; -- Exercise/peak activity HR
                    ELSE
                        base_hr := 65; -- Evening resting HR
                    END IF;
                    
                    INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
                    VALUES (
                        patient_uuid,
                        'heart_rate',
                        base_hr + random() * 20, -- ±10 bpm variation
                        'bpm',
                        (current_date - i * INTERVAL '1 day') + (j * INTERVAL '3 hours') + (random() * INTERVAL '2 hours'),
                        'healthkit'
                    );
                    total_entries := total_entries + 1;
                END;
            END LOOP;
            
            -- Exercise Minutes (some days have workout tracking)
            IF random() < 0.4 THEN -- 40% chance of exercise on any given day
                INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
                VALUES (
                    patient_uuid,
                    'exercise_minutes',
                    15 + random() * 90, -- 15-105 minutes of exercise
                    'minutes',
                    (current_date - i * INTERVAL '1 day') + TIME '17:00:00' + (random() * INTERVAL '4 hours'), -- Evening workouts
                    'healthkit'
                );
                total_entries := total_entries + 1;
            END IF;
            
            -- Blood Glucose (for comprehensive health tracking, some days)
            IF random() < 0.3 THEN -- 30% chance of glucose monitoring
                FOR j IN 1..CASE WHEN random() > 0.7 THEN 3 ELSE 2 END LOOP
                    INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
                    VALUES (
                        patient_uuid,
                        'blood_glucose',
                        80 + random() * 60, -- 80-140 mg/dL (normal to slightly elevated range)
                        'mg/dL',
                        (current_date - i * INTERVAL '1 day') + (j * INTERVAL '6 hours') + TIME '07:00:00' + (random() * INTERVAL '2 hours'),
                        'device'
                    );
                    total_entries := total_entries + 1;
                END LOOP;
            END IF;
            
        END IF;
    END LOOP;
    
    -- Report what was created
    DECLARE
        metric_rec RECORD;
    BEGIN
        RAISE NOTICE '=== MASSIVE HEALTH METRICS DATA SUMMARY ===';
        FOR metric_rec IN (
            SELECT metric_type, COUNT(*) as count 
            FROM patient_health_metrics 
            WHERE patient_id = patient_uuid 
            GROUP BY metric_type 
            ORDER BY count DESC
        ) LOOP
            RAISE NOTICE 'Added % records for %', metric_rec.count, metric_rec.metric_type;
        END LOOP;
        
        RAISE NOTICE '=== TOTALS ===';
        RAISE NOTICE 'Total entries added: %', total_entries;
        RAISE NOTICE 'Days covered: 365 days (1 full year)';
        RAISE NOTICE 'Average entries per day: %', ROUND(total_entries::FLOAT / 365.0, 1);
    END;
    
    RAISE NOTICE '✅ SUCCESS: Massive realistic health metrics data added for patient %', patient_uuid;
    
END $$;