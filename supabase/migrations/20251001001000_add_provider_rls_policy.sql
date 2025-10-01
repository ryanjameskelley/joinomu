-- Add RLS policy for providers to view their own record
-- Migration: 20251001001000_add_provider_rls_policy

-- Add policy for providers to view their own record
CREATE POLICY "Providers can view their own record" ON public.providers
    FOR SELECT USING (
        profile_id = auth.uid()
    );

-- Add comment for documentation
COMMENT ON POLICY "Providers can view their own record" ON public.providers IS 'Allows providers to view their own provider record when authenticated';