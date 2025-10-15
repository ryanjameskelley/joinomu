-- Migration: Add Multi-Treatment Eligibility System
-- This migration adds new tables for flexible eligibility forms across various treatments
-- No existing tables or data will be modified or deleted

-- 1. Treatment Types Table
CREATE TABLE IF NOT EXISTS treatment_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- e.g., 'weight_loss', 'diabetes', 'mens_health'
  display_name TEXT NOT NULL, -- e.g., 'Weight Loss', 'Diabetes Management'
  description TEXT,
  category TEXT, -- e.g., 'metabolic', 'hormonal', 'mental_health'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Eligibility Questions Master Repository
CREATE TABLE IF NOT EXISTS eligibility_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_key TEXT UNIQUE NOT NULL, -- e.g., 'medical_conditions', 'weight_loss_challenges'
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'single_select', 'multi_select', 'text_area', 'number', 'date', 'yes_no'
  options JSONB, -- Array of possible answers for select questions
  validation_rules JSONB, -- e.g., {"required": true, "min": 18, "max": 120}
  category TEXT, -- e.g., 'medical_history', 'lifestyle', 'mental_health', 'medications'
  description TEXT, -- Additional context for the question
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Treatment-Question Mapping
CREATE TABLE IF NOT EXISTS treatment_eligibility_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_type_id UUID NOT NULL REFERENCES treatment_types(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES eligibility_questions(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  order_sequence INTEGER NOT NULL, -- Order in which questions appear
  conditional_logic JSONB, -- e.g., {"show_if": {"question_key": "previous_glp1", "value": "yes"}}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(treatment_type_id, question_id),
  UNIQUE(treatment_type_id, order_sequence)
);

-- 4. Patient Eligibility Submissions
CREATE TABLE IF NOT EXISTS patient_eligibility_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_type_id UUID NOT NULL REFERENCES treatment_types(id),
  submission_status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'submitted'
  eligibility_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'needs_review'
  eligibility_score DECIMAL, -- Calculated eligibility score
  provider_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID, -- Will reference providers(id) when that table exists
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Individual Question Responses
CREATE TABLE IF NOT EXISTS patient_eligibility_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES patient_eligibility_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES eligibility_questions(id),
  response_value JSONB NOT NULL, -- Flexible storage for any response type
  response_text TEXT, -- Human-readable version of the response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, question_id)
);

-- 6. Eligibility Business Rules
CREATE TABLE IF NOT EXISTS eligibility_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_type_id UUID NOT NULL REFERENCES treatment_types(id),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'disqualifying', 'requiring_review', 'scoring'
  conditions JSONB NOT NULL, -- Complex conditions logic
  action JSONB NOT NULL, -- What happens when rule matches
  priority INTEGER DEFAULT 0, -- Rule execution order
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_treatment_eligibility_questions_treatment_type ON treatment_eligibility_questions(treatment_type_id);
CREATE INDEX IF NOT EXISTS idx_treatment_eligibility_questions_question ON treatment_eligibility_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_patient_eligibility_submissions_patient ON patient_eligibility_submissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_eligibility_submissions_treatment ON patient_eligibility_submissions(treatment_type_id);
CREATE INDEX IF NOT EXISTS idx_patient_eligibility_responses_submission ON patient_eligibility_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_patient_eligibility_responses_question ON patient_eligibility_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_rules_treatment_type ON eligibility_rules(treatment_type_id);

-- Enable RLS on all new tables
ALTER TABLE treatment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_eligibility_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_eligibility_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_eligibility_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for treatment_types (readable by all authenticated users)
CREATE POLICY "treatment_types_read_all" ON treatment_types
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "treatment_types_admin_all" ON treatment_types
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for eligibility_questions (readable by all authenticated users)
CREATE POLICY "eligibility_questions_read_all" ON eligibility_questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "eligibility_questions_admin_all" ON eligibility_questions
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for treatment_eligibility_questions (readable by all authenticated users)
CREATE POLICY "treatment_eligibility_questions_read_all" ON treatment_eligibility_questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "treatment_eligibility_questions_admin_all" ON treatment_eligibility_questions
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for patient_eligibility_submissions (patients can only see their own)
CREATE POLICY "patient_eligibility_submissions_patient_access" ON patient_eligibility_submissions
  FOR ALL USING (
    auth.uid()::text = (SELECT profile_id FROM patients WHERE id = patient_id)
    OR auth.role() = 'service_role'
  );

-- RLS Policies for patient_eligibility_responses (patients can only see their own through submission)
CREATE POLICY "patient_eligibility_responses_patient_access" ON patient_eligibility_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patient_eligibility_submissions pes
      JOIN patients p ON p.id = pes.patient_id
      WHERE pes.id = submission_id 
      AND (p.profile_id = auth.uid()::text OR auth.role() = 'service_role')
    )
  );

-- RLS Policies for eligibility_rules (readable by all authenticated users)
CREATE POLICY "eligibility_rules_read_all" ON eligibility_rules
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "eligibility_rules_admin_all" ON eligibility_rules
  FOR ALL USING (auth.role() = 'service_role');

-- Insert sample treatment types
INSERT INTO treatment_types (name, display_name, description, category) VALUES
('weight_loss', 'Weight Loss', 'GLP-1 medications for weight management', 'metabolic'),
('diabetes', 'Diabetes Management', 'Type 2 diabetes treatment and monitoring', 'metabolic'),
('mens_health', 'Men''s Health', 'Testosterone and hormone optimization', 'hormonal'),
('womens_health', 'Women''s Health', 'Hormone therapy and reproductive health', 'hormonal'),
('mental_health', 'Mental Health', 'Depression, anxiety, and mental wellness', 'mental_health')
ON CONFLICT (name) DO NOTHING;

-- Insert sample eligibility questions
INSERT INTO eligibility_questions (question_key, question_text, question_type, options, category, description) VALUES
('medical_conditions', 'Do you have any medical conditions or chronic diseases?', 'multi_select', 
 '["Type 2 Diabetes", "High Blood Pressure", "Heart Disease", "Kidney Disease", "Liver Disease", "High Cholesterol", "Stroke", "Cancer", "Gout", "None of the above"]', 'medical_history',
 'This helps your provider get a complete understanding of your medical history'),

('weight_loss_challenges', 'What are your biggest challenges with weight loss?', 'multi_select',
 '["Cravings and appetite", "Emotional eating", "Lack of time for exercise", "Plateau periods", "Slow metabolism", "Food portion control", "Stress eating", "Social eating situations"]', 'lifestyle',
 'Select your top 3 biggest obstacles to weight loss'),

('previous_glp1', 'Have you previously taken GLP-1 medications?', 'single_select',
 '["Never tried", "Tried but stopped due to side effects", "Tried but stopped for other reasons", "Currently taking"]', 'medical_history',
 'This includes medications like Ozempic, Wegovy, Mounjaro, or Zepbound'),

('mental_health_conditions', 'Have you been diagnosed with any mental health conditions?', 'multi_select',
 '["Depression", "Anxiety", "Bipolar disorder", "Eating disorder", "ADHD", "PTSD", "OCD", "None of the above"]', 'mental_health',
 'Mental health conditions can affect treatment recommendations'),

('current_medications', 'List any medications you are currently taking', 'text_area', null, 'medical_history',
 'Include prescription medications, over-the-counter drugs, and supplements'),

('allergies', 'Do you have any allergies?', 'text_area', null, 'medical_history',
 'Include allergies to food, medications, or other substances'),

('alcohol_consumption', 'How often do you consume 5 or more alcoholic drinks in one occasion?', 'single_select',
 '["Never", "Less than monthly", "Monthly", "Weekly", "Daily or almost daily"]', 'lifestyle',
 'Alcohol can impact effectiveness of certain medications'),

('smoking_status', 'What is your current smoking status?', 'single_select',
 '["Never smoked", "Former smoker", "Current smoker", "Use nicotine replacement products"]', 'lifestyle',
 'Smoking status can affect treatment recommendations'),

('weight_loss_goals', 'What are your weight loss goals?', 'multi_select',
 '["Lose 10-25 pounds", "Lose 25-50 pounds", "Lose 50+ pounds", "Maintain current weight", "Improve overall health", "Reduce medication dependency"]', 'goals',
 'Understanding your goals helps personalize your treatment plan'),

('eating_disorders', 'Have you ever been diagnosed with an eating disorder?', 'single_select',
 '["No", "Anorexia nervosa", "Bulimia nervosa", "Binge eating disorder", "Other eating disorder", "Prefer not to answer"]', 'mental_health',
 'This information helps ensure safe and appropriate treatment'),

('family_medical_history', 'Have you or a family member ever been diagnosed with any of the following conditions?', 'multi_select',
 '["Multiple Endocrine Neoplasia type 2 (MEN 2)", "Medullary thyroid carcinoma (MTC)", "Family history of MTC", "Personal history of pancreatitis", "Family history of pancreatitis", "None of the above"]', 'medical_history',
 'Some conditions can determine which treatments are right for you'),

('gastrointestinal_symptoms', 'Do you ever experience any of these gastrointestinal symptoms?', 'multi_select',
 '["Nausea", "Vomiting", "Diarrhea", "Constipation", "Acid reflux", "Stomach pain", "Loss of appetite", "None of the above"]', 'symptoms',
 'A licensed provider may be able to help you manage side effects'),

('heart_rate', 'What is your average resting heart rate?', 'single_select',
 '["Under 60 bpm", "60-70 bpm", "71-80 bpm", "81-90 bpm", "91-100 bpm", "Over 100 bpm", "I don''t know"]', 'vitals',
 'You can find this using a wearable device or by measuring manually'),

('pregnancy_status', 'Are you currently pregnant, breastfeeding, or planning to become pregnant?', 'single_select',
 '["No", "Currently pregnant", "Currently breastfeeding", "Planning to become pregnant", "Not applicable"]', 'reproductive_health',
 'Certain medications are not recommended during pregnancy or breastfeeding')

ON CONFLICT (question_key) DO NOTHING;

-- Set up weight loss treatment questions
DO $$
DECLARE
    weight_loss_id UUID;
    q_id UUID;
    seq_counter INTEGER := 1;
BEGIN
    -- Get weight loss treatment type ID
    SELECT id INTO weight_loss_id FROM treatment_types WHERE name = 'weight_loss';
    
    -- Add questions for weight loss treatment in order
    
    -- Medical history questions
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'medical_conditions';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence)
    VALUES (weight_loss_id, q_id, true, seq_counter);
    seq_counter := seq_counter + 1;
    
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'family_medical_history';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence)
    VALUES (weight_loss_id, q_id, true, seq_counter);
    seq_counter := seq_counter + 1;
    
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'previous_glp1';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence)
    VALUES (weight_loss_id, q_id, true, seq_counter);
    seq_counter := seq_counter + 1;
    
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'current_medications';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence)
    VALUES (weight_loss_id, q_id, true, seq_counter);
    seq_counter := seq_counter + 1;
    
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'allergies';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence)
    VALUES (weight_loss_id, q_id, true, seq_counter);
    seq_counter := seq_counter + 1;
    
    -- Mental health and eating disorders
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'mental_health_conditions';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence)
    VALUES (weight_loss_id, q_id, true, seq_counter);
    seq_counter := seq_counter + 1;
    
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'eating_disorders';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence)
    VALUES (weight_loss_id, q_id, true, seq_counter);
    seq_counter := seq_counter + 1;
    
    -- Lifestyle questions
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'weight_loss_challenges';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence)
    VALUES (weight_loss_id, q_id, true, seq_counter);
    seq_counter := seq_counter + 1;
    
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'weight_loss_goals';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence)
    VALUES (weight_loss_id, q_id, true, seq_counter);
    seq_counter := seq_counter + 1;
    
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'alcohol_consumption';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence)
    VALUES (weight_loss_id, q_id, true, seq_counter);
    seq_counter := seq_counter + 1;
    
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'smoking_status';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence)
    VALUES (weight_loss_id, q_id, true, seq_counter);
    seq_counter := seq_counter + 1;
    
    -- Physical health
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'gastrointestinal_symptoms';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence)
    VALUES (weight_loss_id, q_id, true, seq_counter);
    seq_counter := seq_counter + 1;
    
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'heart_rate';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence)
    VALUES (weight_loss_id, q_id, true, seq_counter);
    seq_counter := seq_counter + 1;
    
    -- Reproductive health (for applicable patients)
    SELECT id INTO q_id FROM eligibility_questions WHERE question_key = 'pregnancy_status';
    INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, is_required, order_sequence,
                                                 conditional_logic) 
    VALUES (weight_loss_id, q_id, true, seq_counter, '{"show_if": {"applicable_to": ["female", "female_identifying"]}}');
    
END $$;

-- Insert sample eligibility rules for weight loss treatment
DO $$
DECLARE
    weight_loss_id UUID;
BEGIN
    SELECT id INTO weight_loss_id FROM treatment_types WHERE name = 'weight_loss';
    
    -- Disqualifying rule: MEN 2 or MTC history
    INSERT INTO eligibility_rules (treatment_type_id, rule_name, rule_type, conditions, action, priority) VALUES
    (weight_loss_id, 'MEN2_MTC_Disqualification', 'disqualifying',
     '{"any": [{"question": "family_medical_history", "contains": ["Multiple Endocrine Neoplasia type 2 (MEN 2)", "Medullary thyroid carcinoma (MTC)", "Family history of MTC"]}]}',
     '{"result": "disqualified", "reason": "Family history of MEN 2 or MTC is a contraindication for GLP-1 medications"}',
     100);
    
    -- Review required rule: Personal history of pancreatitis
    INSERT INTO eligibility_rules (treatment_type_id, rule_name, rule_type, conditions, action, priority) VALUES
    (weight_loss_id, 'Pancreatitis_Review', 'requiring_review',
     '{"any": [{"question": "family_medical_history", "contains": ["Personal history of pancreatitis", "Family history of pancreatitis"]}]}',
     '{"result": "requires_review", "reason": "History of pancreatitis requires provider review"}',
     90);
    
    -- Review required rule: Eating disorder history
    INSERT INTO eligibility_rules (treatment_type_id, rule_name, rule_type, conditions, action, priority) VALUES
    (weight_loss_id, 'Eating_Disorder_Review', 'requiring_review',
     '{"any": [{"question": "eating_disorders", "not_equals": "No"}]}',
     '{"result": "requires_review", "reason": "History of eating disorders requires careful evaluation"}',
     85);
    
    -- Review required rule: Pregnancy/breastfeeding
    INSERT INTO eligibility_rules (treatment_type_id, rule_name, rule_type, conditions, action, priority) VALUES
    (weight_loss_id, 'Pregnancy_Disqualification', 'disqualifying',
     '{"any": [{"question": "pregnancy_status", "in": ["Currently pregnant", "Currently breastfeeding"]}]}',
     '{"result": "disqualified", "reason": "GLP-1 medications are not recommended during pregnancy or breastfeeding"}',
     95);
    
END $$;

-- Add helpful comments
COMMENT ON TABLE treatment_types IS 'Available treatment types that JoinOmu offers';
COMMENT ON TABLE eligibility_questions IS 'Master repository of all eligibility questions that can be reused across treatments';
COMMENT ON TABLE treatment_eligibility_questions IS 'Maps which questions are required for each treatment type';
COMMENT ON TABLE patient_eligibility_submissions IS 'Patient submissions for treatment eligibility with status tracking';
COMMENT ON TABLE patient_eligibility_responses IS 'Individual question responses for each submission';
COMMENT ON TABLE eligibility_rules IS 'Business rules for determining eligibility based on patient responses';