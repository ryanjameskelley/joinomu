-- Create test appointments for reschedule testing

-- First, let's create a test provider with proper schedule
DO $$
DECLARE
  v_provider_id UUID;
  v_patient_id UUID;
BEGIN
  -- Create test provider
  INSERT INTO providers (
    id,
    profile_id, 
    specialty,
    license_number,
    phone,
    active
  ) VALUES (
    'b692a67a-1356-43a8-a753-af4dd00fbf1d',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Weight Loss',
    'TEST123',
    '+1234567890',
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- Create test provider schedule (Monday to Friday, 9 AM to 5 PM)
  INSERT INTO provider_schedules (
    provider_id,
    day_of_week,
    start_time,
    end_time,
    slot_duration_minutes,
    treatment_types,
    active
  ) VALUES 
    ('b692a67a-1356-43a8-a753-af4dd00fbf1d', 1, '09:00:00', '17:00:00', 30, '{weight_loss}', true),
    ('b692a67a-1356-43a8-a753-af4dd00fbf1d', 2, '09:00:00', '17:00:00', 30, '{weight_loss}', true),
    ('b692a67a-1356-43a8-a753-af4dd00fbf1d', 3, '09:00:00', '17:00:00', 30, '{weight_loss}', true),
    ('b692a67a-1356-43a8-a753-af4dd00fbf1d', 4, '09:00:00', '17:00:00', 30, '{weight_loss}', true),
    ('b692a67a-1356-43a8-a753-af4dd00fbf1d', 5, '09:00:00', '17:00:00', 30, '{weight_loss}', true)
  ON CONFLICT (provider_id, day_of_week, start_time, end_time) DO NOTHING;

  -- Get test patient ID
  SELECT id INTO v_patient_id FROM patients WHERE profile_id = '11111111-1111-1111-1111-111111111111' LIMIT 1;
  
  IF v_patient_id IS NULL THEN
    -- Create test patient if doesn't exist
    INSERT INTO patients (
      id,
      profile_id,
      date_of_birth,
      phone,
      address,
      active
    ) VALUES (
      'b9d1ca67-6c21-454b-a20d-a281a64a5bc0',
      '11111111-1111-1111-1111-111111111111',
      '1990-01-01',
      '+1234567890',
      '123 Test St',
      true
    ) ON CONFLICT (id) DO NOTHING;
    
    v_patient_id := 'b9d1ca67-6c21-454b-a20d-a281a64a5bc0';
  END IF;

  -- Create test appointments
  INSERT INTO appointments (
    id,
    patient_id,
    provider_id,
    appointment_date,
    start_time,
    end_time,
    duration_minutes,
    treatment_type,
    appointment_type,
    status,
    patient_notes,
    booked_by,
    booked_by_user_id
  ) VALUES 
    (
      '1dda6efb-6c80-46a8-88a7-1c09deba1fae',
      v_patient_id,
      'b692a67a-1356-43a8-a753-af4dd00fbf1d',
      '2025-10-08',
      '11:30:00',
      '12:00:00',
      30,
      'weight_loss',
      'consultation',
      'scheduled',
      'Initial consultation for weight management',
      'patient',
      '11111111-1111-1111-1111-111111111111'
    ),
    (
      '2dda6efb-6c80-46a8-88a7-1c09deba2fae',
      v_patient_id,
      'b692a67a-1356-43a8-a753-af4dd00fbf1d',
      '2025-10-01',
      '09:00:00',
      '09:30:00',
      30,
      'weight_loss',
      'consultation',
      'scheduled',
      'Follow-up consultation',
      'patient',
      '11111111-1111-1111-1111-111111111111'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Created test appointments with provider schedules';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error creating test data: %', SQLERRM;
END $$;