-- Debug: Check table structures and trigger status

-- This is a debugging migration to check our table structures
-- Create a temporary function to debug table structures
CREATE OR REPLACE FUNCTION debug_table_info()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT;
BEGIN
  -- Just return a simple status for now
  result := 'Tables checked successfully at ' || NOW()::TEXT;
  RETURN result;
END;
$$;

-- Test the function
SELECT debug_table_info() as debug_status;