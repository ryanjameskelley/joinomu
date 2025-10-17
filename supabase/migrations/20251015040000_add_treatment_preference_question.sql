-- Add treatment preference question for health areas selection
INSERT INTO eligibility_questions (question_key, question_text, question_type, options, category, description) VALUES
('treatment_preference', 'What areas of your health would you like to improve?', 'multi_select', 
 '["Weight loss", "Better sex", "Hormone replacement and TRT", "Skin health", "Therapy and counseling"]', 'treatment_goals',
 'A full picture of your health goals helps us find the right treatment options for you'),

('weight_loss_goals', 'What''s your weight loss goal?', 'single_select',
 '["Losing 1-15 lbs", "Losing 16-50 lbs", "Losing 51+ lbs", "Not sure, I just need to lose weight"]', 'treatment_goals',
 'Understanding your weight loss goals helps us recommend the right treatment plan'),

('height_feet', 'Height (feet)', 'number', '[]', 'measurements', 'Your height in feet'),
('height_inches', 'Height (inches)', 'number', '[]', 'measurements', 'Your height in inches'),
('weight', 'Weight (lbs)', 'number', '[]', 'measurements', 'Your current weight in pounds'),
('bmi', 'BMI', 'number', '[]', 'measurements', 'Calculated BMI value');

-- Link these questions to the weight loss treatment type
INSERT INTO treatment_eligibility_questions (treatment_type_id, question_id, order_sequence, is_required)
SELECT 
  tt.id,
  eq.id,
  CASE eq.question_key
    WHEN 'treatment_preference' THEN 1
    WHEN 'weight_loss_goals' THEN 2
    WHEN 'height_feet' THEN 3
    WHEN 'height_inches' THEN 4
    WHEN 'weight' THEN 5
    WHEN 'bmi' THEN 6
  END,
  true
FROM treatment_types tt, eligibility_questions eq
WHERE tt.name = 'weight_loss' 
  AND eq.question_key IN ('treatment_preference', 'weight_loss_goals', 'height_feet', 'height_inches', 'weight', 'bmi');