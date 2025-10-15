-- Fix the check constraint for fulfillment_status to include 'pharmacy_fulfilled'
-- The error shows the constraint is rejecting 'pharmacy_fulfilled' value

-- First, check current constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'medication_orders'::regclass 
AND conname = 'check_fulfillment_status';

-- Drop the existing constraint
ALTER TABLE medication_orders DROP CONSTRAINT IF EXISTS check_fulfillment_status;

-- Add the updated constraint that includes 'pharmacy_fulfilled'
ALTER TABLE medication_orders ADD CONSTRAINT check_fulfillment_status 
CHECK (fulfillment_status IN ('pending', 'processing', 'pharmacy_fulfilled', 'shipped', 'delivered'));

-- Verify the constraint was added correctly
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'medication_orders'::regclass 
AND conname = 'check_fulfillment_status';

-- Test that 'pharmacy_fulfilled' is now accepted
-- This should succeed without errors
SELECT 'pharmacy_fulfilled'::text WHERE 'pharmacy_fulfilled' IN ('pending', 'processing', 'pharmacy_fulfilled', 'shipped', 'delivered');