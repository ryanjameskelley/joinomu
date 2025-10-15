-- Create medication_tracking_entries table for tracking when medications are taken
CREATE TABLE IF NOT EXISTS public.medication_tracking_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    medication_preference_id UUID NOT NULL REFERENCES public.patient_medication_preferences(id) ON DELETE CASCADE,
    taken_date DATE NOT NULL,
    taken_time TIME,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint to ensure one entry per medication per date
    UNIQUE(patient_id, medication_preference_id, taken_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medication_tracking_patient_id ON public.medication_tracking_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_tracking_preference_id ON public.medication_tracking_entries(medication_preference_id);
CREATE INDEX IF NOT EXISTS idx_medication_tracking_taken_date ON public.medication_tracking_entries(taken_date);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.medication_tracking_entries ENABLE ROW LEVEL SECURITY;

-- Policy for patients to see only their own tracking entries
CREATE POLICY "Users can view their own medication tracking entries" ON public.medication_tracking_entries
    FOR SELECT USING (
        auth.uid() IN (
            SELECT profile_id 
            FROM public.patients 
            WHERE id = medication_tracking_entries.patient_id
        )
    );

-- Policy for patients to insert their own tracking entries
CREATE POLICY "Users can insert their own medication tracking entries" ON public.medication_tracking_entries
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT profile_id 
            FROM public.patients 
            WHERE id = medication_tracking_entries.patient_id
        )
    );

-- Policy for patients to update their own tracking entries
CREATE POLICY "Users can update their own medication tracking entries" ON public.medication_tracking_entries
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT profile_id 
            FROM public.patients 
            WHERE id = medication_tracking_entries.patient_id
        )
    );

-- Policy for patients to delete their own tracking entries
CREATE POLICY "Users can delete their own medication tracking entries" ON public.medication_tracking_entries
    FOR DELETE USING (
        auth.uid() IN (
            SELECT profile_id 
            FROM public.patients 
            WHERE id = medication_tracking_entries.patient_id
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medication_tracking_entries_updated_at 
    BEFORE UPDATE ON public.medication_tracking_entries
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();