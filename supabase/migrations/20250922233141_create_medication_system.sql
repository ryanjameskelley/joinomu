-- Medication Management System Schema
-- Create all tables for medication workflow

-- 1. Medications Master Catalog
CREATE TABLE medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    generic_name TEXT,
    brand_name TEXT,
    dosage_form TEXT NOT NULL, -- 'injection', 'tablet', 'capsule', etc.
    strength TEXT NOT NULL, -- '200mg', '0.5ml', etc.
    description TEXT,
    category TEXT NOT NULL, -- 'weight_loss', 'mens_health', etc.
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    requires_prescription BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Patient Medication Preferences (Patient Selections)
CREATE TABLE patient_medication_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    preferred_dosage TEXT,
    frequency TEXT, -- 'weekly', 'monthly', 'daily', etc.
    notes TEXT, -- patient notes/preferences
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'discontinued'
    requested_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(patient_id, medication_id) -- One preference per patient per medication
);

-- 3. Medication Approvals (Provider Decisions)
CREATE TABLE medication_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    preference_id UUID NOT NULL REFERENCES patient_medication_preferences(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'needs_review', -- 'approved', 'denied', 'needs_review'
    approved_dosage TEXT,
    approved_frequency TEXT,
    provider_notes TEXT,
    contraindications TEXT,
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Medication Orders (Fulfillment & Payment)
CREATE TABLE medication_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    approval_id UUID NOT NULL REFERENCES medication_approvals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    payment_method TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    fulfillment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered'
    tracking_number TEXT,
    shipped_date TIMESTAMP WITH TIME ZONE,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_medications_category ON medications(category);
CREATE INDEX idx_medications_active ON medications(active);
CREATE INDEX idx_patient_medication_preferences_patient_id ON patient_medication_preferences(patient_id);
CREATE INDEX idx_patient_medication_preferences_status ON patient_medication_preferences(status);
CREATE INDEX idx_medication_approvals_provider_id ON medication_approvals(provider_id);
CREATE INDEX idx_medication_approvals_status ON medication_approvals(status);
CREATE INDEX idx_medication_orders_patient_id ON medication_orders(patient_id);
CREATE INDEX idx_medication_orders_payment_status ON medication_orders(payment_status);
CREATE INDEX idx_medication_orders_fulfillment_status ON medication_orders(fulfillment_status);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_medication_preferences_updated_at BEFORE UPDATE ON patient_medication_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medication_approvals_updated_at BEFORE UPDATE ON medication_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medication_orders_updated_at BEFORE UPDATE ON medication_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add check constraints for valid status values
ALTER TABLE patient_medication_preferences 
ADD CONSTRAINT check_preference_status 
CHECK (status IN ('pending', 'approved', 'denied', 'discontinued'));

ALTER TABLE medication_approvals 
ADD CONSTRAINT check_approval_status 
CHECK (status IN ('approved', 'denied', 'needs_review'));

ALTER TABLE medication_orders 
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

ALTER TABLE medication_orders 
ADD CONSTRAINT check_fulfillment_status 
CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'delivered'));

-- Add check constraint for positive amounts
ALTER TABLE medication_orders 
ADD CONSTRAINT check_positive_amounts 
CHECK (unit_price >= 0 AND total_amount >= 0 AND quantity > 0);