-- Restore Core Tracking Tables Only
-- This migration creates only the essential tracking tables needed for the patient app

-- ============================================================================
-- 1. MEDICATION TRACKING ENTRIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.medication_tracking_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    medication_preference_id uuid NOT NULL,
    taken_date date NOT NULL,
    taken_time time without time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 2. PATIENT HEALTH METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.patient_health_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    metric_type text NOT NULL,
    value numeric NOT NULL,
    unit text NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    synced_from text DEFAULT 'manual'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT patient_health_metrics_metric_type_check CHECK ((metric_type = ANY (ARRAY['weight'::text, 'heart_rate'::text, 'blood_pressure'::text, 'steps'::text, 'sleep'::text, 'blood_glucose'::text, 'exercise_minutes'::text, 'calories'::text, 'protein'::text, 'sugar'::text, 'water'::text]))),
    CONSTRAINT patient_health_metrics_synced_from_check CHECK ((synced_from = ANY (ARRAY['healthkit'::text, 'manual'::text, 'device'::text, 'provider'::text]))),
    CONSTRAINT patient_health_metrics_value_check CHECK ((value >= (0)::numeric))
);

-- ============================================================================
-- PRIMARY KEYS
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medication_tracking_entries_pkey') THEN
        ALTER TABLE ONLY public.medication_tracking_entries ADD CONSTRAINT medication_tracking_entries_pkey PRIMARY KEY (id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patient_health_metrics_pkey') THEN
        ALTER TABLE ONLY public.patient_health_metrics ADD CONSTRAINT patient_health_metrics_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medication_tracking_entries_unique_per_day') THEN
        ALTER TABLE ONLY public.medication_tracking_entries
            ADD CONSTRAINT medication_tracking_entries_unique_per_day UNIQUE (patient_id, medication_preference_id, taken_date);
    END IF;
END $$;

-- ============================================================================
-- FOREIGN KEYS (only if referenced tables exist)
-- ============================================================================

DO $$
BEGIN
    -- Add foreign key to patients if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medication_tracking_entries_patient_id_fkey') THEN
            ALTER TABLE ONLY public.medication_tracking_entries
                ADD CONSTRAINT medication_tracking_entries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patient_health_metrics_patient_id_fkey') THEN
            ALTER TABLE ONLY public.patient_health_metrics
                ADD CONSTRAINT patient_health_metrics_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add foreign key to patient_medication_preferences if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_medication_preferences' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medication_tracking_entries_medication_preference_id_fkey') THEN
            ALTER TABLE ONLY public.medication_tracking_entries
                ADD CONSTRAINT medication_tracking_entries_medication_preference_id_fkey FOREIGN KEY (medication_preference_id) REFERENCES public.patient_medication_preferences(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Medication tracking indexes
CREATE INDEX IF NOT EXISTS idx_medication_tracking_patient_id ON public.medication_tracking_entries USING btree (patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_tracking_preference_id ON public.medication_tracking_entries USING btree (medication_preference_id);
CREATE INDEX IF NOT EXISTS idx_medication_tracking_taken_date ON public.medication_tracking_entries USING btree (taken_date);

-- Patient health metrics indexes
CREATE INDEX IF NOT EXISTS idx_patient_health_metrics_patient_id ON public.patient_health_metrics USING btree (patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_health_metrics_metric_type ON public.patient_health_metrics USING btree (metric_type);
CREATE INDEX IF NOT EXISTS idx_patient_health_metrics_recorded_at ON public.patient_health_metrics USING btree (recorded_at);
CREATE INDEX IF NOT EXISTS idx_patient_health_metrics_patient_metric_date ON public.patient_health_metrics USING btree (patient_id, metric_type, recorded_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.medication_tracking_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_health_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

DO $$
BEGIN
    -- Check if update_updated_at_column function exists, create if not
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ language 'plpgsql';
    END IF;

    -- Create update triggers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_medication_tracking_entries_updated_at') THEN
        CREATE TRIGGER update_medication_tracking_entries_updated_at BEFORE UPDATE ON public.medication_tracking_entries
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_patient_health_metrics_updated_at') THEN
        CREATE TRIGGER update_patient_health_metrics_updated_at BEFORE UPDATE ON public.patient_health_metrics
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    tracking_exists boolean;
    metrics_exists boolean;
BEGIN
    -- Check if tables were created
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'medication_tracking_entries' 
        AND table_schema = 'public'
    ) INTO tracking_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'patient_health_metrics' 
        AND table_schema = 'public'
    ) INTO metrics_exists;

    IF tracking_exists AND metrics_exists THEN
        RAISE NOTICE '✅ SUCCESS: Core tracking tables restored successfully!';
        RAISE NOTICE '  - medication_tracking_entries: CREATED';
        RAISE NOTICE '  - patient_health_metrics: CREATED';
        RAISE NOTICE '  The tracking/treatments page should now work properly.';
    ELSE
        RAISE WARNING '❌ FAILED: One or more tables were not created properly';
        RAISE WARNING '  - medication_tracking_entries: %', CASE WHEN tracking_exists THEN 'EXISTS' ELSE 'MISSING' END;
        RAISE WARNING '  - patient_health_metrics: %', CASE WHEN metrics_exists THEN 'EXISTS' ELSE 'MISSING' END;
    END IF;
END $$;