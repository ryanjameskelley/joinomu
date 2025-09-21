-- ===========================================
-- SECTION 2: Create RLS Policies
-- ===========================================

-- PATIENTS TABLE POLICIES
CREATE POLICY "Users can view own patient data" ON patients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own patient data" ON patients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Providers can view assigned patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patient_providers pp
      JOIN providers prov ON prov.id = pp.provider_id
      WHERE pp.patient_id = patients.id 
      AND prov.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all patients" ON patients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- PROVIDERS TABLE POLICIES
CREATE POLICY "Users can view own provider data" ON providers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own provider data" ON providers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all providers" ON providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- ADMINS TABLE POLICIES
CREATE POLICY "Users can view own admin data" ON admins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all admin data" ON admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- PATIENT_PROVIDERS TABLE POLICIES
CREATE POLICY "Providers can view their assignments" ON patient_providers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM providers 
      WHERE id = patient_providers.provider_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view their assignments" ON patient_providers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE id = patient_providers.patient_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all assignments" ON patient_providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );