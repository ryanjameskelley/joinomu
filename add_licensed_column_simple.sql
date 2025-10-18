-- Simple fix to add the licensed column
ALTER TABLE providers ADD COLUMN licensed TEXT[] DEFAULT '{}';

-- Test that it worked
SELECT column_name FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'licensed';