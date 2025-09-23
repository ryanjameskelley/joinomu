-- Add sent_to_pharmacy field to medication_orders table
-- This tracks when the prescription was sent to pharmacy (separate from shipped_date)

ALTER TABLE medication_orders 
ADD COLUMN sent_to_pharmacy TIMESTAMP WITH TIME ZONE;

-- Add index for performance
CREATE INDEX idx_medication_orders_sent_to_pharmacy ON medication_orders(sent_to_pharmacy);

-- Add comment to clarify the difference between fields
COMMENT ON COLUMN medication_orders.sent_to_pharmacy IS 'Date when prescription was sent to pharmacy for processing';
COMMENT ON COLUMN medication_orders.shipped_date IS 'Date when medication was physically shipped to patient';