-- Create schedules for existing providers who are missing them (fixed version)

DO $$
DECLARE
    provider_rec RECORD;
    created_count INTEGER := 0;
    total_providers INTEGER;
    complete_providers INTEGER;
    total_schedules INTEGER;
BEGIN
    RAISE NOTICE '=== CREATING MISSING PROVIDER SCHEDULES ===';
    
    -- Find all providers without complete schedules (should have 5 weekday schedules)
    FOR provider_rec IN (
        SELECT p.id, p.profile_id, prof.first_name, prof.last_name,
               COUNT(ps.id) as schedule_count
        FROM public.providers p
        LEFT JOIN public.provider_schedules ps ON p.id = ps.provider_id
        LEFT JOIN public.profiles prof ON p.profile_id = prof.id
        GROUP BY p.id, p.profile_id, prof.first_name, prof.last_name
        HAVING COUNT(ps.id) < 5
    ) LOOP
        RAISE NOTICE 'Provider: % % (ID: %) has % schedules, creating missing ones...', 
            provider_rec.first_name, provider_rec.last_name, 
            provider_rec.id, provider_rec.schedule_count;
        
        -- Create Monday-Friday schedules if they don't exist
        FOR day_num IN 1..5 LOOP
            IF NOT EXISTS (
                SELECT 1 FROM public.provider_schedules 
                WHERE provider_id = provider_rec.id 
                AND day_of_week = day_num
            ) THEN
                INSERT INTO public.provider_schedules (
                    provider_id, day_of_week, start_time, end_time, active, created_at
                ) VALUES (
                    provider_rec.id, day_num, '09:00:00'::TIME, '17:00:00'::TIME, true, NOW()
                );
                created_count := created_count + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ Created % missing schedules', created_count;
    
    -- Show final statistics
    SELECT COUNT(*) INTO total_providers FROM public.providers;
    
    SELECT COUNT(DISTINCT p.id) INTO complete_providers 
    FROM public.providers p 
    JOIN public.provider_schedules ps ON p.id = ps.provider_id 
    GROUP BY p.id HAVING COUNT(ps.id) >= 5;
    
    SELECT COUNT(*) INTO total_schedules FROM public.provider_schedules;
        
    RAISE NOTICE 'Final statistics:';
    RAISE NOTICE '  Total providers: %', total_providers;
    RAISE NOTICE '  Providers with complete schedules: %', COALESCE(complete_providers, 0);
    RAISE NOTICE '  Total schedules in system: %', total_schedules;
        
END $$;