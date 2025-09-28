-- Add support for multiple dosages per medication
-- This migration restructures the medication system to allow multiple dosages

-- 1. Create medication_dosages table for flexible dosage options
CREATE TABLE medication_dosages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    strength TEXT NOT NULL, -- '0.5mg', '1.0mg', '2.5mg', etc.
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0, -- For ordering dosages (lowest to highest)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(medication_id, strength) -- One strength per medication
);

-- 2. Add indexes for performance
CREATE INDEX idx_medication_dosages_medication_id ON medication_dosages(medication_id);
CREATE INDEX idx_medication_dosages_available ON medication_dosages(available);
CREATE INDEX idx_medication_dosages_sort_order ON medication_dosages(sort_order);

-- 3. Add trigger for updated_at timestamp
CREATE TRIGGER update_medication_dosages_updated_at 
BEFORE UPDATE ON medication_dosages 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Migrate existing data from medications table to the new structure
-- First, get the first occurrence of each unique medication
WITH base_medications AS (
    SELECT DISTINCT ON (name, brand_name)
        id as base_id,
        name,
        generic_name,
        brand_name,
        dosage_form,
        description,
        category,
        requires_prescription,
        active
    FROM medications
    WHERE active = true
    ORDER BY name, brand_name, id
),
-- Then collect all dosages for each medication name/brand combination
medication_dosages_to_insert AS (
    SELECT 
        bm.base_id as medication_id,
        m.strength,
        m.unit_price,
        row_number() OVER (PARTITION BY bm.base_id ORDER BY 
            CASE 
                WHEN m.strength ~ '^[0-9.]+' THEN 
                    CAST(regexp_replace(m.strength, '[^0-9.]', '', 'g') AS DECIMAL)
                ELSE 999999 
            END
        ) as sort_order
    FROM base_medications bm
    JOIN medications m ON (m.name = bm.name AND m.brand_name = bm.brand_name)
    WHERE m.active = true
)
INSERT INTO medication_dosages (medication_id, strength, unit_price, sort_order)
SELECT medication_id, strength, unit_price, sort_order
FROM medication_dosages_to_insert;

-- 5. Update medication_preferences to reference medication_dosage_id instead of storing dosage text
-- First add the new column
ALTER TABLE patient_medication_preferences 
ADD COLUMN medication_dosage_id UUID REFERENCES medication_dosages(id) ON DELETE SET NULL;

-- 6. Migrate existing preferences to use the new dosage references
UPDATE patient_medication_preferences 
SET medication_dosage_id = (
    SELECT md.id 
    FROM medication_dosages md 
    WHERE md.medication_id = patient_medication_preferences.medication_id 
    AND md.strength = patient_medication_preferences.preferred_dosage
    LIMIT 1
);

-- 7. For preferences without exact dosage matches, use the first available dosage
UPDATE patient_medication_preferences 
SET medication_dosage_id = (
    SELECT md.id 
    FROM medication_dosages md 
    WHERE md.medication_id = patient_medication_preferences.medication_id 
    ORDER BY md.sort_order
    LIMIT 1
)
WHERE medication_dosage_id IS NULL;

-- 8. Clean up duplicate medications, keeping only the base ones that have dosages
-- First, update references in other tables to point to the base medication
UPDATE patient_medication_preferences 
SET medication_id = (
    SELECT md.medication_id 
    FROM medication_dosages md 
    WHERE md.id = patient_medication_preferences.medication_dosage_id
)
WHERE medication_dosage_id IS NOT NULL;

-- Update medication_approvals references
UPDATE medication_approvals 
SET approved_dosage = (
    SELECT md.strength 
    FROM medication_dosages md 
    JOIN patient_medication_preferences pmp ON md.id = pmp.medication_dosage_id
    WHERE pmp.id = medication_approvals.preference_id
)
WHERE approved_dosage IS NULL OR approved_dosage = 'As requested';

-- Update medication_orders references  
UPDATE medication_orders 
SET medication_id = (
    SELECT pmp.medication_id 
    FROM patient_medication_preferences pmp 
    JOIN medication_approvals ma ON ma.preference_id = pmp.id
    WHERE ma.id = medication_orders.approval_id
),
unit_price = (
    SELECT md.unit_price 
    FROM medication_dosages md 
    JOIN patient_medication_preferences pmp ON md.id = pmp.medication_dosage_id
    JOIN medication_approvals ma ON ma.preference_id = pmp.id
    WHERE ma.id = medication_orders.approval_id
),
total_amount = (
    SELECT md.unit_price * medication_orders.quantity
    FROM medication_dosages md 
    JOIN patient_medication_preferences pmp ON md.id = pmp.medication_dosage_id
    JOIN medication_approvals ma ON ma.preference_id = pmp.id
    WHERE ma.id = medication_orders.approval_id
);

-- 9. Remove duplicate medications (keep only those that have dosages in the new table)
DELETE FROM medications 
WHERE id NOT IN (
    SELECT DISTINCT medication_id 
    FROM medication_dosages
);

-- 10. Remove the now-redundant strength and unit_price columns from medications table
-- (We'll keep them for now to avoid breaking existing code, but mark them as deprecated)
-- ALTER TABLE medications DROP COLUMN strength;
-- ALTER TABLE medications DROP COLUMN unit_price;

-- 11. Add a comment to indicate the new structure
COMMENT ON TABLE medication_dosages IS 'Stores multiple dosage options for each medication. Replaces the single strength field in medications table.';
COMMENT ON COLUMN patient_medication_preferences.medication_dosage_id IS 'References the specific dosage selected by the patient. New preferred method over preferred_dosage text field.';

-- 12. Add some additional dosage options for existing medications to demonstrate flexibility
-- Tirzepatide additional dosages
INSERT INTO medication_dosages (medication_id, strength, unit_price, sort_order)
SELECT 
    m.id,
    unnest(ARRAY['5.0mg', '7.5mg', '10mg', '12.5mg', '15mg']) as strength,
    unnest(ARRAY[1399.99, 1599.99, 1799.99, 1999.99, 2199.99]) as unit_price,
    generate_series(10, 50, 10) as sort_order
FROM medications m 
WHERE m.name = 'Tirzepatide' AND m.brand_name = 'Mounjaro'
ON CONFLICT (medication_id, strength) DO NOTHING;

-- Semaglutide additional dosages for Ozempic
INSERT INTO medication_dosages (medication_id, strength, unit_price, sort_order)
SELECT 
    m.id,
    unnest(ARRAY['0.25mg', '1.0mg', '2.0mg']) as strength,
    unnest(ARRAY[799.99, 999.99, 1199.99]) as unit_price,
    generate_series(1, 30, 10) as sort_order
FROM medications m 
WHERE m.name = 'Semaglutide' AND m.brand_name = 'Ozempic'
ON CONFLICT (medication_id, strength) DO NOTHING;

-- Testosterone Cypionate additional dosages
INSERT INTO medication_dosages (medication_id, strength, unit_price, sort_order)
SELECT 
    m.id,
    unnest(ARRAY['100mg/ml', '250mg/ml']) as strength,
    unnest(ARRAY[159.99, 239.99]) as unit_price,
    generate_series(5, 15, 10) as sort_order
FROM medications m 
WHERE m.name = 'Testosterone Cypionate'
ON CONFLICT (medication_id, strength) DO NOTHING;