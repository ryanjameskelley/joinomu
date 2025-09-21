#!/bin/bash

# Supabase project details
PROJECT_URL="https://ukyczgfoqhdbamxycrkn.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreWN6Z2ZvcWhkYmFteHljcmtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEzNTA2MCwiZXhwIjoyMDcwNzExMDYwfQ.NQlf3t5n3eSfMiuLAuILCyFblkHjNaaORYabIY0CPaY"

echo "Applying RLS policies for patients table..."

# SQL for patients RLS policies
PATIENTS_SQL="-- Enable RLS on patients table if not already enabled
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to insert their own patient record
DROP POLICY IF EXISTS \"Users can insert their own patient record\" ON public.patients;
CREATE POLICY \"Users can insert their own patient record\" ON public.patients
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to read their own patient data
DROP POLICY IF EXISTS \"Users can read their own patient data\" ON public.patients;
CREATE POLICY \"Users can read their own patient data\" ON public.patients
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy to allow users to update their own patient data
DROP POLICY IF EXISTS \"Users can update their own patient data\" ON public.patients;
CREATE POLICY \"Users can update their own patient data\" ON public.patients
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own patient data
DROP POLICY IF EXISTS \"Users can delete their own patient data\" ON public.patients;
CREATE POLICY \"Users can delete their own patient data\" ON public.patients
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);"

# Execute the SQL
curl -X POST "$PROJECT_URL/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$PATIENTS_SQL\"}"

echo -e "\n\nApplying RLS policies for admins table..."

# SQL for admins RLS policies
ADMINS_SQL="-- Enable RLS on admins table if not already enabled
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to insert their own admin record
DROP POLICY IF EXISTS \"Users can insert their own admin record\" ON public.admins;
CREATE POLICY \"Users can insert their own admin record\" ON public.admins
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow admins to read their own admin data
DROP POLICY IF EXISTS \"Admins can read their own admin data\" ON public.admins;
CREATE POLICY \"Admins can read their own admin data\" ON public.admins
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy to allow admins to update their own admin data
DROP POLICY IF EXISTS \"Admins can update their own admin data\" ON public.admins;
CREATE POLICY \"Admins can update their own admin data\" ON public.admins
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);"

# Execute the SQL
curl -X POST "$PROJECT_URL/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$ADMINS_SQL\"}"

echo -e "\n\nRLS policies applied successfully!"