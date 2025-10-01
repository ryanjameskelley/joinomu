-- Add RLS policies for fax and medication approval functionality
-- Migration: 20251001000000_add_fax_rls_policies

-- Enable RLS on medication_approvals table
ALTER TABLE public.medication_approvals ENABLE ROW LEVEL SECURITY;

-- Enable RLS on faxes table
ALTER TABLE public.faxes ENABLE ROW LEVEL SECURITY;

-- Policies for medication_approvals table

-- Providers can view approvals they created
CREATE POLICY "Providers can view their own approvals" ON public.medication_approvals
    FOR SELECT USING (
        provider_id IN (
            SELECT p.id FROM public.providers p WHERE p.profile_id = auth.uid()
        )
    );

-- Providers can create approvals for their assigned patients
CREATE POLICY "Providers can create approvals for assigned patients" ON public.medication_approvals
    FOR INSERT WITH CHECK (
        provider_id IN (
            SELECT p.id FROM public.providers p WHERE p.profile_id = auth.uid()
        )
        AND preference_id IN (
            SELECT pmp.id FROM public.patient_medication_preferences pmp
            JOIN public.patients pat ON pmp.patient_id = pat.id
            JOIN public.patient_assignments pa ON pat.id = pa.patient_id
            WHERE pa.provider_id IN (
                SELECT p.id FROM public.providers p WHERE p.profile_id = auth.uid()
            )
            AND pa.active = true
        )
    );

-- Providers can update their own approvals
CREATE POLICY "Providers can update their own approvals" ON public.medication_approvals
    FOR UPDATE USING (
        provider_id IN (
            SELECT p.id FROM public.providers p WHERE p.profile_id = auth.uid()
        )
    );

-- Patients can view approvals for their own preferences
CREATE POLICY "Patients can view their own approvals" ON public.medication_approvals
    FOR SELECT USING (
        preference_id IN (
            SELECT pmp.id FROM public.patient_medication_preferences pmp
            JOIN public.patients pat ON pmp.patient_id = pat.id
            WHERE pat.profile_id = auth.uid()
        )
    );

-- Admins can manage all approvals
CREATE POLICY "Admins can manage all approvals" ON public.medication_approvals
    FOR ALL USING (
        auth.uid() IN (
            SELECT a.profile_id FROM public.admins a WHERE a.active = true
        )
    );

-- Policies for faxes table

-- Providers can view faxes they sent
CREATE POLICY "Providers can view their own faxes" ON public.faxes
    FOR SELECT USING (
        provider_id IN (
            SELECT p.id FROM public.providers p WHERE p.profile_id = auth.uid()
        )
    );

-- Providers can create faxes for their assigned patients
CREATE POLICY "Providers can create faxes for assigned patients" ON public.faxes
    FOR INSERT WITH CHECK (
        provider_id IN (
            SELECT p.id FROM public.providers p WHERE p.profile_id = auth.uid()
        )
        AND patient_id IN (
            SELECT pa.patient_id FROM public.patient_assignments pa
            WHERE pa.provider_id IN (
                SELECT p.id FROM public.providers p WHERE p.profile_id = auth.uid()
            )
            AND pa.active = true
        )
    );

-- Providers can update their own faxes
CREATE POLICY "Providers can update their own faxes" ON public.faxes
    FOR UPDATE USING (
        provider_id IN (
            SELECT p.id FROM public.providers p WHERE p.profile_id = auth.uid()
        )
    );

-- Patients can view faxes related to their medications
CREATE POLICY "Patients can view their own faxes" ON public.faxes
    FOR SELECT USING (
        patient_id IN (
            SELECT pat.id FROM public.patients pat WHERE pat.profile_id = auth.uid()
        )
    );

-- Admins can manage all faxes
CREATE POLICY "Admins can manage all faxes" ON public.faxes
    FOR ALL USING (
        auth.uid() IN (
            SELECT a.profile_id FROM public.admins a WHERE a.active = true
        )
    );

-- Add comments for documentation
COMMENT ON POLICY "Providers can view their own approvals" ON public.medication_approvals IS 'Allows providers to view medication approvals they created';
COMMENT ON POLICY "Providers can create approvals for assigned patients" ON public.medication_approvals IS 'Allows providers to create approvals only for patients assigned to them';
COMMENT ON POLICY "Patients can view their own approvals" ON public.medication_approvals IS 'Allows patients to view approvals for their medication preferences';

COMMENT ON POLICY "Providers can view their own faxes" ON public.faxes IS 'Allows providers to view faxes they sent';
COMMENT ON POLICY "Providers can create faxes for assigned patients" ON public.faxes IS 'Allows providers to create faxes only for patients assigned to them';
COMMENT ON POLICY "Patients can view their own faxes" ON public.faxes IS 'Allows patients to view faxes related to their medications';