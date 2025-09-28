-- ================================
-- JoinOmu Appointment System - Phase 1
-- Sample Data for Testing
-- ================================

-- ================================
-- 1. Sample Provider Schedules
-- ================================

-- Insert sample schedules for existing providers
-- Note: This assumes providers already exist from previous migrations

-- Provider 1: Monday-Friday 9 AM to 5 PM, 30-minute slots
INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, slot_duration_minutes, treatment_types)
SELECT 
  p.id,
  generate_series(1, 5) as day_of_week, -- Monday to Friday
  '09:00:00'::TIME as start_time,
  '17:00:00'::TIME as end_time,
  30 as slot_duration_minutes,
  ARRAY['weight_loss', 'diabetes_management', 'consultation']::TEXT[] as treatment_types
FROM providers p
WHERE EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = p.profile_id)
LIMIT 1;

-- Provider 1: Lunch break override (unavailable 12-1 PM)
INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, slot_duration_minutes, treatment_types)
SELECT 
  p.id,
  generate_series(1, 5) as day_of_week, -- Monday to Friday
  '12:00:00'::TIME as start_time,
  '13:00:00'::TIME as end_time,
  30 as slot_duration_minutes,
  '{}'::TEXT[] as treatment_types -- Empty array = available for all
FROM providers p
WHERE EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = p.profile_id)
LIMIT 1;

-- Provider 2: Different schedule (if exists) - Tuesday, Thursday 10 AM to 4 PM
INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, slot_duration_minutes, treatment_types)
SELECT 
  p.id,
  unnest(ARRAY[2, 4]) as day_of_week, -- Tuesday and Thursday
  '10:00:00'::TIME as start_time,
  '16:00:00'::TIME as end_time,
  45 as slot_duration_minutes,
  ARRAY['weight_loss', 'nutrition_counseling']::TEXT[] as treatment_types
FROM providers p
WHERE EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = p.profile_id)
OFFSET 1 LIMIT 1;

-- ================================
-- 2. Sample Availability Overrides
-- ================================

-- Provider vacation days (next week)
INSERT INTO provider_availability_overrides (provider_id, date, available, reason)
SELECT 
  p.id,
  CURRENT_DATE + INTERVAL '7 days' + INTERVAL '1 day' * generate_series(0, 4), -- Next week
  false as available,
  'Vacation week' as reason
FROM providers p
WHERE EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = p.profile_id)
LIMIT 1;

-- Special extended hours for one day
INSERT INTO provider_availability_overrides (provider_id, date, start_time, end_time, available, reason)
SELECT 
  p.id,
  CURRENT_DATE + INTERVAL '3 days' as date,
  '07:00:00'::TIME as start_time,
  '09:00:00'::TIME as end_time,
  true as available,
  'Early morning availability' as reason
FROM providers p
WHERE EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = p.profile_id)
LIMIT 1;

-- ================================
-- 3. Sample Appointments
-- ================================

-- Create some sample appointments for testing
-- Note: This will use existing patient-provider assignments

-- Tomorrow's appointments
INSERT INTO appointments (
  patient_id, 
  provider_id, 
  assignment_id,
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
)
SELECT 
  pa.patient_id,
  pa.provider_id,
  pa.id as assignment_id,
  CURRENT_DATE + INTERVAL '1 day' as appointment_date,
  '10:00:00'::TIME as start_time,
  '10:30:00'::TIME as end_time,
  30 as duration_minutes,
  COALESCE(pa.treatment_type, 'consultation') as treatment_type,
  'consultation' as appointment_type,
  'scheduled' as status,
  'Looking forward to my appointment' as patient_notes,
  'patient' as booked_by,
  prof.id as booked_by_user_id
FROM patient_assignments pa
INNER JOIN patients pt ON pa.patient_id = pt.id
INNER JOIN profiles prof ON pt.profile_id = prof.id
WHERE pa.active = true
LIMIT 3;

-- Day after tomorrow's appointments
INSERT INTO appointments (
  patient_id, 
  provider_id, 
  assignment_id,
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
)
SELECT 
  pa.patient_id,
  pa.provider_id,
  pa.id as assignment_id,
  CURRENT_DATE + INTERVAL '2 days' as appointment_date,
  ('14:00:00'::TIME + INTERVAL '30 minutes' * (ROW_NUMBER() OVER () - 1)) as start_time,
  ('14:30:00'::TIME + INTERVAL '30 minutes' * (ROW_NUMBER() OVER () - 1)) as end_time,
  30 as duration_minutes,
  COALESCE(pa.treatment_type, 'follow_up') as treatment_type,
  'follow_up' as appointment_type,
  'confirmed' as status,
  'Follow-up appointment' as patient_notes,
  'provider' as booked_by,
  prof.id as booked_by_user_id
FROM patient_assignments pa
INNER JOIN providers prov ON pa.provider_id = prov.id
INNER JOIN profiles prof ON prov.profile_id = prof.id
WHERE pa.active = true
LIMIT 2;

-- One cancelled appointment for history testing
INSERT INTO appointments (
  patient_id, 
  provider_id, 
  assignment_id,
  appointment_date, 
  start_time, 
  end_time, 
  duration_minutes,
  treatment_type,
  appointment_type,
  status,
  cancelled_at,
  cancelled_by,
  cancellation_reason,
  booked_by,
  booked_by_user_id
)
SELECT 
  pa.patient_id,
  pa.provider_id,
  pa.id as assignment_id,
  CURRENT_DATE + INTERVAL '1 day' as appointment_date,
  '15:00:00'::TIME as start_time,
  '15:30:00'::TIME as end_time,
  30 as duration_minutes,
  COALESCE(pa.treatment_type, 'consultation') as treatment_type,
  'consultation' as appointment_type,
  'cancelled' as status,
  NOW() - INTERVAL '2 hours' as cancelled_at,
  'patient' as cancelled_by,
  'Schedule conflict' as cancellation_reason,
  'patient' as booked_by,
  prof.id as booked_by_user_id
FROM patient_assignments pa
INNER JOIN patients pt ON pa.patient_id = pt.id
INNER JOIN profiles prof ON pt.profile_id = prof.id
WHERE pa.active = true
LIMIT 1;

-- ================================
-- 4. Create Test Views for Validation
-- ================================

-- View to easily see provider availability
CREATE OR REPLACE VIEW provider_availability_summary AS
SELECT 
  p.id as provider_id,
  (prof.first_name || ' ' || prof.last_name) as provider_name,
  ps.day_of_week,
  CASE ps.day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_name,
  ps.start_time,
  ps.end_time,
  ps.slot_duration_minutes,
  ps.treatment_types,
  ps.active
FROM providers p
INNER JOIN profiles prof ON p.profile_id = prof.id
INNER JOIN provider_schedules ps ON p.id = ps.provider_id
ORDER BY p.id, ps.day_of_week, ps.start_time;

-- View to see upcoming appointments
CREATE OR REPLACE VIEW upcoming_appointments_summary AS
SELECT 
  a.id as appointment_id,
  (patient_prof.first_name || ' ' || patient_prof.last_name) as patient_name,
  (provider_prof.first_name || ' ' || provider_prof.last_name) as provider_name,
  a.appointment_date,
  a.start_time,
  a.end_time,
  a.treatment_type,
  a.appointment_type,
  a.status,
  a.created_at
FROM appointments a
INNER JOIN patients p ON a.patient_id = p.id
INNER JOIN profiles patient_prof ON p.profile_id = patient_prof.id
INNER JOIN providers prov ON a.provider_id = prov.id
INNER JOIN profiles provider_prof ON prov.profile_id = provider_prof.id
WHERE a.appointment_date >= CURRENT_DATE
ORDER BY a.appointment_date, a.start_time;

-- ================================
-- 5. Grant Permissions on Views
-- ================================

GRANT SELECT ON provider_availability_summary TO authenticated;
GRANT SELECT ON upcoming_appointments_summary TO authenticated;

-- ================================
-- 6. Sample Data Comments
-- ================================

COMMENT ON VIEW provider_availability_summary IS 'Easy view of all provider schedules with readable day names';
COMMENT ON VIEW upcoming_appointments_summary IS 'Overview of all upcoming appointments with patient and provider names';

-- ================================
-- 7. Validation Queries for Testing
-- ================================

-- These can be run manually to verify the system is working

/*
-- Test 1: Check available slots for a provider
SELECT * FROM get_available_slots(
  (SELECT id FROM providers LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '3 days'
) LIMIT 10;

-- Test 2: Check patient appointments
SELECT * FROM get_patient_appointments(
  (SELECT profile_id FROM patients LIMIT 1),
  false
);

-- Test 3: Book an appointment
SELECT * FROM book_appointment(
  (SELECT profile_id FROM patients LIMIT 1),
  (SELECT id FROM providers LIMIT 1),
  CURRENT_DATE + INTERVAL '3 days',
  '11:00:00',
  'consultation',
  'consultation',
  'patient'
);

-- Test 4: Admin overview
SELECT * FROM get_admin_appointment_overview(
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days'
);
*/