-- Add licensed column to providers table to store array of state abbreviations
ALTER TABLE providers 
ADD COLUMN licensed TEXT[] DEFAULT '{}';

-- Add comment to describe the column
COMMENT ON COLUMN providers.licensed IS 'Array of US state abbreviations where the provider is licensed to practice (e.g., [''CA'', ''NY'', ''TX''])';

-- Create index for efficient querying of licensed states
CREATE INDEX idx_providers_licensed ON providers USING GIN (licensed);

-- Create a function to validate state abbreviations
CREATE OR REPLACE FUNCTION validate_state_abbreviations(states TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  -- If null or empty array, it's valid
  IF states IS NULL OR array_length(states, 1) IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check each state abbreviation
  FOR i IN 1..array_length(states, 1) LOOP
    IF states[i] !~ '^[A-Z]{2}$' THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint using the function
ALTER TABLE providers 
ADD CONSTRAINT chk_licensed_state_format 
CHECK (validate_state_abbreviations(licensed));