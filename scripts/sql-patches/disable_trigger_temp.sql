-- Temporarily disable the trigger to test manual user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a simple test function to verify database connection
CREATE OR REPLACE FUNCTION test_connection()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'Database connection working at ' || NOW()::TEXT;
END;
$$;

SELECT test_connection() as status;