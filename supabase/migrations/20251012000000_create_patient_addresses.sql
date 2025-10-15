-- Patient Addresses Migration
-- Creates a flexible address system supporting multiple address types per patient
-- Required for medication shipping and billing purposes

-- ============================================
-- PATIENT ADDRESSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.patient_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    address_type TEXT NOT NULL CHECK (address_type IN ('shipping', 'billing', 'emergency')),
    street_line_1 TEXT NOT NULL,
    street_line_2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'US',
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verification_method TEXT CHECK (verification_method IN ('usps', 'ups', 'fedex', 'manual', 'user_confirmed')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure only one primary address per type per patient
    CONSTRAINT unique_primary_address 
        EXCLUDE (patient_id WITH =, address_type WITH =) 
        WHERE (is_primary = true)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_patient_addresses_patient_id ON public.patient_addresses(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_addresses_type ON public.patient_addresses(address_type);
CREATE INDEX IF NOT EXISTS idx_patient_addresses_primary ON public.patient_addresses(patient_id, address_type) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_patient_addresses_verified ON public.patient_addresses(is_verified);

-- ============================================
-- TRIGGERS
-- ============================================

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_patient_addresses_updated_at
    BEFORE UPDATE ON public.patient_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on patient_addresses
ALTER TABLE public.patient_addresses ENABLE ROW LEVEL SECURITY;

-- Patients can view their own addresses
CREATE POLICY "Patients can view their own addresses" ON public.patient_addresses
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE profile_id = auth.uid()
        )
    );

-- Patients can insert their own addresses
CREATE POLICY "Patients can insert their own addresses" ON public.patient_addresses
    FOR INSERT WITH CHECK (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE profile_id = auth.uid()
        )
    );

-- Patients can update their own addresses
CREATE POLICY "Patients can update their own addresses" ON public.patient_addresses
    FOR UPDATE USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE profile_id = auth.uid()
        )
    );

-- Patients can delete their own addresses
CREATE POLICY "Patients can delete their own addresses" ON public.patient_addresses
    FOR DELETE USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE profile_id = auth.uid()
        )
    );

-- Providers can view addresses for their assigned patients
CREATE POLICY "Providers can view assigned patient addresses" ON public.patient_addresses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.patient_assignments pa 
            JOIN public.providers p ON p.id = pa.provider_id 
            WHERE p.profile_id = auth.uid() 
                AND pa.patient_id = patient_addresses.patient_id 
                AND pa.active = true
        )
    );

-- Admins can manage all addresses
CREATE POLICY "Admins can manage all patient addresses" ON public.patient_addresses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE profile_id = auth.uid() AND active = true
        )
    );

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to set primary address for a patient
CREATE OR REPLACE FUNCTION set_primary_address(
    patient_profile_id UUID,
    address_id UUID,
    address_type_param TEXT
)
RETURNS JSON AS $$
DECLARE
    patient_record_id UUID;
    address_exists BOOLEAN := false;
BEGIN
    -- Get patient record ID
    SELECT id INTO patient_record_id 
    FROM public.patients 
    WHERE profile_id = patient_profile_id;
    
    IF patient_record_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Patient not found');
    END IF;
    
    -- Check if address exists and belongs to patient
    SELECT EXISTS(
        SELECT 1 FROM public.patient_addresses 
        WHERE id = address_id 
            AND patient_id = patient_record_id
            AND address_type = address_type_param
    ) INTO address_exists;
    
    IF NOT address_exists THEN
        RETURN json_build_object('success', false, 'error', 'Address not found or access denied');
    END IF;
    
    -- Remove primary flag from other addresses of same type
    UPDATE public.patient_addresses 
    SET is_primary = false 
    WHERE patient_id = patient_record_id 
        AND address_type = address_type_param 
        AND id != address_id;
    
    -- Set the specified address as primary
    UPDATE public.patient_addresses 
    SET is_primary = true 
    WHERE id = address_id;
    
    RETURN json_build_object('success', true, 'message', 'Primary address updated');
    
EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get primary shipping address for a patient
CREATE OR REPLACE FUNCTION get_primary_shipping_address(patient_profile_id UUID)
RETURNS JSON AS $$
DECLARE
    patient_record_id UUID;
    address_record RECORD;
BEGIN
    -- Get patient record ID
    SELECT id INTO patient_record_id 
    FROM public.patients 
    WHERE profile_id = patient_profile_id;
    
    IF patient_record_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Patient not found');
    END IF;
    
    -- Get primary shipping address
    SELECT * INTO address_record
    FROM public.patient_addresses 
    WHERE patient_id = patient_record_id 
        AND address_type = 'shipping' 
        AND is_primary = true
    LIMIT 1;
    
    -- If no primary address, get the first shipping address
    IF address_record IS NULL THEN
        SELECT * INTO address_record
        FROM public.patient_addresses 
        WHERE patient_id = patient_record_id 
            AND address_type = 'shipping'
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;
    
    IF address_record IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No shipping address found');
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'address', row_to_json(address_record)
    );
    
EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate address format
CREATE OR REPLACE FUNCTION validate_address_format(
    street_line_1_param TEXT,
    city_param TEXT,
    state_param TEXT,
    postal_code_param TEXT,
    country_param TEXT DEFAULT 'US'
)
RETURNS JSON AS $$
DECLARE
    errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Validate required fields
    IF street_line_1_param IS NULL OR LENGTH(TRIM(street_line_1_param)) = 0 THEN
        errors := array_append(errors, 'Street address is required');
    END IF;
    
    IF city_param IS NULL OR LENGTH(TRIM(city_param)) = 0 THEN
        errors := array_append(errors, 'City is required');
    END IF;
    
    IF state_param IS NULL OR LENGTH(TRIM(state_param)) = 0 THEN
        errors := array_append(errors, 'State is required');
    END IF;
    
    IF postal_code_param IS NULL OR LENGTH(TRIM(postal_code_param)) = 0 THEN
        errors := array_append(errors, 'Postal code is required');
    END IF;
    
    -- Validate US postal code format
    IF country_param = 'US' AND postal_code_param IS NOT NULL THEN
        IF NOT postal_code_param ~ '^\d{5}(-\d{4})?$' THEN
            errors := array_append(errors, 'Invalid US postal code format (use 12345 or 12345-6789)');
        END IF;
    END IF;
    
    -- Validate US state format (2 letter abbreviation)
    IF country_param = 'US' AND state_param IS NOT NULL THEN
        IF LENGTH(state_param) != 2 OR state_param !~ '^[A-Z]{2}$' THEN
            errors := array_append(errors, 'State must be a 2-letter abbreviation (e.g., CA, NY, TX)');
        END IF;
    END IF;
    
    IF array_length(errors, 1) > 0 THEN
        RETURN json_build_object('valid', false, 'errors', errors);
    ELSE
        RETURN json_build_object('valid', true, 'message', 'Address format is valid');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON public.patient_addresses TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Patient addresses system created successfully