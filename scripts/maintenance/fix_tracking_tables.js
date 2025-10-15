// Restore tracking tables directly
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMAs_-AdVY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function restoreTrackingTables() {
  console.log('Creating medication_tracking_entries table...')
  
  const { error: trackingError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.medication_tracking_entries (
          id uuid DEFAULT gen_random_uuid() NOT NULL,
          patient_id uuid NOT NULL,
          medication_preference_id uuid NOT NULL,
          taken_date date NOT NULL,
          taken_time time without time zone,
          notes text,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          CONSTRAINT medication_tracking_entries_pkey PRIMARY KEY (id),
          CONSTRAINT medication_tracking_entries_unique_per_day UNIQUE (patient_id, medication_preference_id, taken_date)
      );
      
      ALTER TABLE public.medication_tracking_entries ENABLE ROW LEVEL SECURITY;
      
      CREATE INDEX IF NOT EXISTS idx_medication_tracking_patient_id ON public.medication_tracking_entries USING btree (patient_id);
      CREATE INDEX IF NOT EXISTS idx_medication_tracking_preference_id ON public.medication_tracking_entries USING btree (medication_preference_id);
      CREATE INDEX IF NOT EXISTS idx_medication_tracking_taken_date ON public.medication_tracking_entries USING btree (taken_date);
    `
  })
  
  if (trackingError) {
    console.error('Error creating medication_tracking_entries:', trackingError)
  } else {
    console.log('✅ medication_tracking_entries table created')
  }

  console.log('Creating patient_health_metrics table...')
  
  const { error: metricsError } = await supabase.rpc('exec_sql', {
    sql: `
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
          CONSTRAINT patient_health_metrics_pkey PRIMARY KEY (id),
          CONSTRAINT patient_health_metrics_metric_type_check CHECK ((metric_type = ANY (ARRAY['weight'::text, 'heart_rate'::text, 'blood_pressure'::text, 'steps'::text, 'sleep'::text, 'blood_glucose'::text, 'exercise_minutes'::text, 'calories'::text, 'protein'::text, 'sugar'::text, 'water'::text]))),
          CONSTRAINT patient_health_metrics_synced_from_check CHECK ((synced_from = ANY (ARRAY['healthkit'::text, 'manual'::text, 'device'::text, 'provider'::text]))),
          CONSTRAINT patient_health_metrics_value_check CHECK ((value >= (0)::numeric))
      );
      
      ALTER TABLE public.patient_health_metrics ENABLE ROW LEVEL SECURITY;
      
      CREATE INDEX IF NOT EXISTS idx_patient_health_metrics_patient_id ON public.patient_health_metrics USING btree (patient_id);
      CREATE INDEX IF NOT EXISTS idx_patient_health_metrics_metric_type ON public.patient_health_metrics USING btree (metric_type);
      CREATE INDEX IF NOT EXISTS idx_patient_health_metrics_recorded_at ON public.patient_health_metrics USING btree (recorded_at);
      CREATE INDEX IF NOT EXISTS idx_patient_health_metrics_patient_metric_date ON public.patient_health_metrics USING btree (patient_id, metric_type, recorded_at);
    `
  })
  
  if (metricsError) {
    console.error('Error creating patient_health_metrics:', metricsError)
  } else {
    console.log('✅ patient_health_metrics table created')
  }

  // Verify tables exist
  const { data: tables, error: listError } = await supabase.rpc('exec_sql', {
    sql: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('medication_tracking_entries', 'patient_health_metrics');`
  })
  
  if (listError) {
    console.error('Error listing tables:', listError)
  } else {
    console.log('✅ Tables verified:', tables)
  }
}

restoreTrackingTables().catch(console.error)