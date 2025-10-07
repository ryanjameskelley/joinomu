-- Create patient_health_metrics table
CREATE TABLE IF NOT EXISTS public.patient_health_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL CHECK (metric_type IN (
        'weight', 
        'heart_rate', 
        'blood_pressure', 
        'steps', 
        'sleep', 
        'blood_glucose', 
        'exercise_minutes', 
        'calories', 
        'protein', 
        'sugar', 
        'water'
    )),
    value NUMERIC NOT NULL CHECK (value >= 0),
    unit TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_from TEXT DEFAULT 'manual' CHECK (synced_from IN ('healthkit', 'manual', 'device', 'provider')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_health_metrics_patient_id ON public.patient_health_metrics(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_health_metrics_metric_type ON public.patient_health_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_patient_health_metrics_recorded_at ON public.patient_health_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_patient_health_metrics_patient_metric_date ON public.patient_health_metrics(patient_id, metric_type, recorded_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patient_health_metrics_updated_at
    BEFORE UPDATE ON public.patient_health_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.patient_health_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Patients can only see their own health metrics
CREATE POLICY "Users can view their own health metrics" ON public.patient_health_metrics
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE profile_id = auth.uid() OR user_id = auth.uid()
        )
    );

-- Patients can insert their own health metrics
CREATE POLICY "Users can insert their own health metrics" ON public.patient_health_metrics
    FOR INSERT WITH CHECK (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE profile_id = auth.uid() OR user_id = auth.uid()
        )
    );

-- Patients can update their own health metrics
CREATE POLICY "Users can update their own health metrics" ON public.patient_health_metrics
    FOR UPDATE USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE profile_id = auth.uid() OR user_id = auth.uid()
        )
    );

-- Patients can delete their own health metrics
CREATE POLICY "Users can delete their own health metrics" ON public.patient_health_metrics
    FOR DELETE USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE profile_id = auth.uid() OR user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.patient_health_metrics TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;