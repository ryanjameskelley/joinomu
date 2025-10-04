-- Update the fulfillment status check constraint to include 'pharmacy_fulfilled'
-- First, drop the existing constraint
ALTER TABLE medication_orders DROP CONSTRAINT IF EXISTS check_fulfillment_status;

-- Add the new constraint with 'pharmacy_fulfilled' option
ALTER TABLE medication_orders ADD CONSTRAINT check_fulfillment_status 
CHECK (fulfillment_status IN ('pending', 'processing', 'pharmacy_fulfilled', 'shipped', 'delivered'));

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT check_fulfillment_status ON medication_orders IS 
'Ensures fulfillment_status is one of: pending, processing, pharmacy_fulfilled, shipped, delivered';