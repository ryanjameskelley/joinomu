-- Add supply field to medication_approvals table
-- Migration: 20251001040000_add_supply_to_medication_approvals

-- Add supply column to track prescription supply duration
ALTER TABLE public.medication_approvals 
ADD COLUMN supply_days INTEGER;

-- Add index for performance
CREATE INDEX idx_medication_approvals_supply_days ON public.medication_approvals(supply_days);

-- Add comment for documentation
COMMENT ON COLUMN public.medication_approvals.supply_days IS 'Number of days the prescription supply should last (e.g., 30, 60, 90 days)';