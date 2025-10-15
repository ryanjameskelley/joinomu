-- Restoration Script for Missing Tables
-- Based on complete_backup_20251011_040522.sql.gz
-- Run this in Supabase SQL Editor

-- ============================================================================
-- CORE MEDICATION AND TRACKING TABLES
-- ============================================================================

-- 1. Medications table (master reference)
CREATE TABLE IF NOT EXISTS public.medications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    generic_name text,
    brand_name text,
    dosage_form text NOT NULL,
    strength text NOT NULL,
    description text,
    category text NOT NULL,
    unit_price numeric(10,2) DEFAULT 0 NOT NULL,
    requires_prescription boolean DEFAULT true,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Medication dosages table (multiple dosage options per medication)
CREATE TABLE IF NOT EXISTS public.medication_dosages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    medication_id uuid NOT NULL,
    strength text NOT NULL,
    unit_price numeric(10,2) DEFAULT 0 NOT NULL,
    available boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Patient medication preferences (patient medication assignments)
CREATE TABLE IF NOT EXISTS public.patient_medication_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    medication_id uuid NOT NULL,
    preferred_dosage text,
    frequency text,
    notes text,
    status text DEFAULT 'pending'::text NOT NULL,
    requested_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    medication_dosage_id uuid,
    faxed timestamp with time zone,
    next_prescription_due date,
    supply_days integer,
    refill_requested boolean DEFAULT false,
    CONSTRAINT check_preference_status CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text, 'discontinued'::text])))
);

-- 4. Medication tracking entries (daily medication logs)
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

-- 5. Patient health metrics (daily health tracking)
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
-- PRIMARY KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.medication_dosages
    ADD CONSTRAINT medication_dosages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.patient_medication_preferences
    ADD CONSTRAINT patient_medication_preferences_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.medication_tracking_entries
    ADD CONSTRAINT medication_tracking_entries_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.patient_health_metrics
    ADD CONSTRAINT patient_health_metrics_pkey PRIMARY KEY (id);

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

ALTER TABLE ONLY public.patient_medication_preferences
    ADD CONSTRAINT patient_medication_preferences_patient_id_medication_id_key UNIQUE (patient_id, medication_id);

ALTER TABLE ONLY public.medication_tracking_entries
    ADD CONSTRAINT medication_tracking_entries_patient_id_medication_preferenc_key UNIQUE (patient_id, medication_preference_id, taken_date);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE ONLY public.medication_dosages
    ADD CONSTRAINT medication_dosages_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.patient_medication_preferences
    ADD CONSTRAINT patient_medication_preferences_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.patient_medication_preferences
    ADD CONSTRAINT patient_medication_preferences_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.patient_medication_preferences
    ADD CONSTRAINT patient_medication_preferences_medication_dosage_id_fkey FOREIGN KEY (medication_dosage_id) REFERENCES public.medication_dosages(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.medication_tracking_entries
    ADD CONSTRAINT medication_tracking_entries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.medication_tracking_entries
    ADD CONSTRAINT medication_tracking_entries_medication_preference_id_fkey FOREIGN KEY (medication_preference_id) REFERENCES public.patient_medication_preferences(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.patient_health_metrics
    ADD CONSTRAINT patient_health_metrics_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Medications indexes
CREATE INDEX IF NOT EXISTS idx_medications_active ON public.medications USING btree (active);
CREATE INDEX IF NOT EXISTS idx_medications_category ON public.medications USING btree (category);

-- Medication dosages indexes
CREATE INDEX IF NOT EXISTS idx_medication_dosages_medication_id ON public.medication_dosages USING btree (medication_id);

-- Patient medication preferences indexes
CREATE INDEX IF NOT EXISTS idx_patient_medication_preferences_patient_id ON public.patient_medication_preferences USING btree (patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medication_preferences_status ON public.patient_medication_preferences USING btree (status);
CREATE INDEX IF NOT EXISTS idx_patient_medication_preferences_refill_requested ON public.patient_medication_preferences USING btree (refill_requested);
CREATE INDEX IF NOT EXISTS idx_patient_medication_preferences_next_due ON public.patient_medication_preferences USING btree (next_prescription_due);
CREATE INDEX IF NOT EXISTS idx_patient_medication_preferences_faxed ON public.patient_medication_preferences USING btree (faxed);
CREATE INDEX IF NOT EXISTS idx_patient_medication_preferences_supply_days ON public.patient_medication_preferences USING btree (supply_days);
CREATE INDEX IF NOT EXISTS idx_preferences_provider_approval ON public.patient_medication_preferences USING btree (status, refill_requested) WHERE ((status = 'pending'::text) AND (refill_requested = true));

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

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_dosages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_medication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_tracking_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_health_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE public.medication_dosages IS 'Stores multiple dosage options for each medication. Replaces the single strength field in medications table.';

COMMENT ON COLUMN public.patient_medication_preferences.medication_dosage_id IS 'References the specific dosage selected by the patient. New preferred method over preferred_dosage text field.';
COMMENT ON COLUMN public.patient_medication_preferences.faxed IS 'Timestamp when prescription was last faxed to pharmacy';
COMMENT ON COLUMN public.patient_medication_preferences.next_prescription_due IS 'Calculated date when next prescription should be due based on frequency and delivery';
COMMENT ON COLUMN public.patient_medication_preferences.supply_days IS 'Number of days of medication supply when approved via medication adjustments';
COMMENT ON COLUMN public.patient_medication_preferences.refill_requested IS 'TRUE when patient has explicitly requested a refill, FALSE when preference was set to pending by admin/system';

-- ============================================================================
-- UPDATE TRIGGERS (if needed)
-- ============================================================================

-- Check if update_updated_at_column function exists, if not create it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update triggers for all tables with updated_at columns
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_dosages_updated_at BEFORE UPDATE ON public.medication_dosages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_medication_preferences_updated_at BEFORE UPDATE ON public.patient_medication_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_tracking_entries_updated_at BEFORE UPDATE ON public.medication_tracking_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_health_metrics_updated_at BEFORE UPDATE ON public.patient_health_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all tables were created successfully
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'medications', 
    'medication_dosages', 
    'patient_medication_preferences', 
    'medication_tracking_entries', 
    'patient_health_metrics'
)
ORDER BY tablename;

-- Display success message
SELECT 'SUCCESS: All core medication and health tracking tables have been restored!' as result;