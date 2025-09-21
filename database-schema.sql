-- =============================================================================
-- JoinOmu Database Schema
-- Complete schema for healthcare application with eligibility and health metrics
-- =============================================================================

-- Update existing patients table with new fields
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS height_inches NUMERIC,
ADD COLUMN IF NOT EXISTS weight_pounds NUMERIC,
ADD COLUMN IF NOT EXISTS treatment_type TEXT,
ADD COLUMN IF NOT EXISTS medical_history TEXT[],
ADD COLUMN IF NOT EXISTS current_medications TEXT[],
ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS eligibility_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS eligibility_notes TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_health_sync TIMESTAMPTZ;

-- Update existing admins table with new fields
ALTER TABLE public.admins 
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create eligibility_submissions table
CREATE TABLE IF NOT EXISTS public.eligibility_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  treatment_type TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  height_inches NUMERIC NOT NULL,
  weight_pounds NUMERIC NOT NULL,
  bmi NUMERIC NOT NULL,
  medical_history TEXT[],
  current_medications TEXT[],
  insurance_provider TEXT,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  eligibility_status TEXT DEFAULT 'pending',
  requires_review BOOLEAN DEFAULT false,
  linked_to_user UUID REFERENCES auth.users(id),
  linked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patient_health_metrics table
CREATE TABLE IF NOT EXISTS public.patient_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  synced_from TEXT DEFAULT 'manual',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wearable_devices table for device management
CREATE TABLE IF NOT EXISTS public.wearable_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL, -- 'apple_watch', 'fitbit', 'garmin', etc.
  device_name TEXT,
  device_identifier TEXT, -- unique device ID
  is_connected BOOLEAN DEFAULT false,
  last_sync TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'realtime', -- 'realtime', 'hourly', 'daily'
  enabled_metrics TEXT[] DEFAULT ARRAY[]::TEXT[], -- which metrics to sync
  connection_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create health_data_permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.health_data_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL, -- 'view', 'edit', 'export'
  metric_types TEXT[], -- specific metrics they can access, null = all
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create health_goals table for patient goal tracking
CREATE TABLE IF NOT EXISTS public.health_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'weight_loss', 'steps', 'exercise_minutes', etc.
  target_value NUMERIC NOT NULL,
  target_unit TEXT NOT NULL,
  current_value NUMERIC DEFAULT 0,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled'
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_eligibility_submissions_email ON public.eligibility_submissions(email);
CREATE INDEX IF NOT EXISTS idx_eligibility_submissions_status ON public.eligibility_submissions(eligibility_status);
CREATE INDEX IF NOT EXISTS idx_health_metrics_patient_id ON public.patient_health_metrics(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_type_date ON public.patient_health_metrics(metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_eligibility_status ON public.patients(eligibility_status);
CREATE INDEX IF NOT EXISTS idx_patients_treatment_type ON public.patients(treatment_type);
CREATE INDEX IF NOT EXISTS idx_admins_role_active ON public.admins(role, is_active);
CREATE INDEX IF NOT EXISTS idx_wearable_devices_patient_id ON public.wearable_devices(patient_id);
CREATE INDEX IF NOT EXISTS idx_wearable_devices_connected ON public.wearable_devices(is_connected, last_sync);
CREATE INDEX IF NOT EXISTS idx_health_permissions_patient_id ON public.health_data_permissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_permissions_active ON public.health_data_permissions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_health_goals_patient_status ON public.health_goals(patient_id, status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_eligibility_submissions_updated_at ON public.eligibility_submissions;
CREATE TRIGGER update_eligibility_submissions_updated_at 
    BEFORE UPDATE ON public.eligibility_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_metrics_updated_at ON public.patient_health_metrics;
CREATE TRIGGER update_health_metrics_updated_at 
    BEFORE UPDATE ON public.patient_health_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wearable_devices_updated_at ON public.wearable_devices;
CREATE TRIGGER update_wearable_devices_updated_at 
    BEFORE UPDATE ON public.wearable_devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_permissions_updated_at ON public.health_data_permissions;
CREATE TRIGGER update_health_permissions_updated_at 
    BEFORE UPDATE ON public.health_data_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_goals_updated_at ON public.health_goals;
CREATE TRIGGER update_health_goals_updated_at 
    BEFORE UPDATE ON public.health_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS Policies for new tables
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE public.eligibility_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wearable_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_data_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;

-- Eligibility submissions policies
CREATE POLICY "Users can view their own eligibility submissions" ON public.eligibility_submissions
FOR SELECT TO authenticated USING (
  auth.uid()::text = linked_to_user::text
);

CREATE POLICY "Admins can view all eligibility submissions" ON public.eligibility_submissions
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND 'view_all_patients' = ANY(permissions)
  )
);

CREATE POLICY "Anyone can insert eligibility submissions" ON public.eligibility_submissions
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update eligibility submissions" ON public.eligibility_submissions
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND 'edit_all_patients' = ANY(permissions)
  )
);

-- Health metrics policies
CREATE POLICY "Patients can view their own health metrics" ON public.patient_health_metrics
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE id = patient_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Patients can insert their own health metrics" ON public.patient_health_metrics
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE id = patient_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Patients can update their own health metrics" ON public.patient_health_metrics
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE id = patient_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all health metrics" ON public.patient_health_metrics
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND 'view_medical_data' = ANY(permissions)
  )
);

-- Wearable devices policies
CREATE POLICY "Patients can manage their own devices" ON public.wearable_devices
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE id = patient_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all devices" ON public.wearable_devices
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND 'view_all_patients' = ANY(permissions)
  )
);

-- Health data permissions policies
CREATE POLICY "Patients can manage their own health permissions" ON public.health_data_permissions
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE id = patient_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Providers can view permissions granted to them" ON public.health_data_permissions
FOR SELECT TO authenticated USING (
  provider_id IN (
    SELECT id FROM public.providers 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all health permissions" ON public.health_data_permissions
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND 'view_medical_data' = ANY(permissions)
  )
);

-- Health goals policies
CREATE POLICY "Patients can manage their own goals" ON public.health_goals
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE id = patient_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Providers can view goals for their patients" ON public.health_goals
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.health_data_permissions hdp
    JOIN public.providers p ON p.id = hdp.provider_id
    WHERE hdp.patient_id = patient_id
    AND p.user_id = auth.uid()
    AND hdp.is_active = true
    AND (hdp.expires_at IS NULL OR hdp.expires_at > NOW())
    AND hdp.permission_type IN ('view', 'edit')
  )
);

CREATE POLICY "Admins can view all health goals" ON public.health_goals
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND 'view_medical_data' = ANY(permissions)
  )
);

-- =============================================================================
-- Sample data for testing (optional)
-- =============================================================================

-- Insert sample treatment types
INSERT INTO public.eligibility_submissions (
  email, treatment_type, first_name, last_name, age, height_inches, weight_pounds, bmi, state, zip_code
) VALUES 
  ('test.patient@example.com', 'glp1', 'Test', 'Patient', 35, 70, 180, 25.7, 'CA', '90210'),
  ('demo.user@example.com', 'weight-management', 'Demo', 'User', 42, 68, 200, 30.4, 'NY', '10001')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Views for common queries
-- =============================================================================

-- Patient dashboard view
CREATE OR REPLACE VIEW patient_dashboard AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.treatment_type,
  p.eligibility_status,
  p.onboarding_completed,
  p.last_health_sync,
  COUNT(hm.id) as total_health_records,
  MAX(hm.recorded_at) as last_health_record
FROM public.patients p
LEFT JOIN public.patient_health_metrics hm ON p.id = hm.patient_id
GROUP BY p.id, p.email, p.first_name, p.last_name, p.treatment_type, p.eligibility_status, p.onboarding_completed, p.last_health_sync;

-- Admin analytics view  
CREATE OR REPLACE VIEW admin_analytics AS
SELECT 
  COUNT(*) FILTER (WHERE eligibility_status = 'pending') as pending_eligibility,
  COUNT(*) FILTER (WHERE eligibility_status = 'approved') as approved_patients,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as active_patients,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as signups_today,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) FILTER (WHERE onboarding_completed = true) as avg_onboarding_hours
FROM public.patients;

-- Health metrics summary view
CREATE OR REPLACE VIEW health_metrics_summary AS
SELECT 
  patient_id,
  metric_type,
  COUNT(*) as total_records,
  AVG(value) as avg_value,
  MIN(value) as min_value,
  MAX(value) as max_value,
  MAX(recorded_at) as last_recorded
FROM public.patient_health_metrics
GROUP BY patient_id, metric_type;

-- Grant permissions to authenticated users
GRANT SELECT ON patient_dashboard TO authenticated;
GRANT SELECT ON admin_analytics TO authenticated;
GRANT SELECT ON health_metrics_summary TO authenticated;