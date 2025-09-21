-- Enable RLS on patients table if not already enabled
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to insert their own patient record
CREATE POLICY "Users can insert their own patient record" ON public.patients
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to read their own patient data
CREATE POLICY "Users can read their own patient data" ON public.patients
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy to allow users to update their own patient data
CREATE POLICY "Users can update their own patient data" ON public.patients
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own patient data
CREATE POLICY "Users can delete their own patient data" ON public.patients
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);