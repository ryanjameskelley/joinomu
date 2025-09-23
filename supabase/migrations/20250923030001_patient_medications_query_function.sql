-- Function to get patient medications with payment and shipping details
-- This replaces the simple string array with full medication objects

CREATE OR REPLACE FUNCTION get_patient_medications_detailed(patient_uuid UUID)
RETURNS TABLE (
    medication_id UUID,
    medication_name TEXT,
    dosage TEXT,
    supply TEXT,
    status TEXT,
    last_payment_date TIMESTAMP WITH TIME ZONE,
    sent_to_pharmacy_date TIMESTAMP WITH TIME ZONE,
    shipped_date TIMESTAMP WITH TIME ZONE,
    tracking_number TEXT,
    order_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as medication_id,
        m.name as medication_name,
        CONCAT(m.strength, ' ', m.dosage_form) as dosage,
        CASE 
            WHEN mo.quantity > 1 THEN CONCAT(mo.quantity::TEXT, ' units')
            ELSE '30 day supply'
        END as supply,
        mo.fulfillment_status as status,
        mo.payment_date as last_payment_date,
        mo.sent_to_pharmacy as sent_to_pharmacy_date,
        mo.shipped_date as shipped_date,
        mo.tracking_number as tracking_number,
        mo.id as order_id
    FROM medication_orders mo
    JOIN medications m ON mo.medication_id = m.id
    JOIN medication_approvals ma ON mo.approval_id = ma.id
    JOIN patient_medication_preferences pmp ON ma.preference_id = pmp.id
    WHERE mo.patient_id = patient_uuid
    AND pmp.status = 'approved'
    AND ma.status = 'approved'
    ORDER BY mo.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_patient_medications_detailed(UUID) TO authenticated;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_medication_orders_patient_created 
ON medication_orders(patient_id, created_at DESC);

-- Add sent_to_pharmacy column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medication_orders' 
        AND column_name = 'sent_to_pharmacy'
    ) THEN
        ALTER TABLE medication_orders 
        ADD COLUMN sent_to_pharmacy TIMESTAMP WITH TIME ZONE;
        
        CREATE INDEX idx_medication_orders_sent_to_pharmacy 
        ON medication_orders(sent_to_pharmacy);
    END IF;
END $$;