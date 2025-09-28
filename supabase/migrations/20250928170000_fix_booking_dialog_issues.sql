-- Fix booking dialog issues: slots function, calendar navigation, and display
-- Fix the get_available_slots_for_provider function with proper PostgreSQL syntax

DROP FUNCTION IF EXISTS get_available_slots_for_provider(UUID, DATE, DATE, TEXT);
DROP FUNCTION IF EXISTS get_available_slots(UUID, DATE, DATE, TEXT);

-- Create a working slots function
CREATE OR REPLACE FUNCTION get_available_slots_for_provider(
  p_provider_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_treatment_type TEXT DEFAULT NULL
) RETURNS TABLE (
  slot_date DATE,
  slot_start_time TIME,
  slot_end_time TIME,
  duration_minutes INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE date_series AS (
    SELECT p_start_date AS date
    UNION ALL
    SELECT date + 1
    FROM date_series
    WHERE date < p_end_date
  ),
  provider_daily_schedule AS (
    SELECT 
      ds.date,
      ps.start_time,
      ps.end_time,
      ps.slot_duration_minutes,
      ps.treatment_types
    FROM date_series ds
    CROSS JOIN provider_schedules ps
    WHERE ps.provider_id = p_provider_id
      AND ps.active = true
      AND ps.day_of_week = EXTRACT(DOW FROM ds.date)
      AND (
        p_treatment_type IS NULL 
        OR array_length(ps.treatment_types, 1) IS NULL 
        OR p_treatment_type = ANY(ps.treatment_types)
      )
  ),
  time_slots AS (
    SELECT 
      pds.date,
      slot_time::TIME AS start_time,
      (slot_time + (pds.slot_duration_minutes || ' minutes')::INTERVAL)::TIME AS end_time,
      pds.slot_duration_minutes
    FROM provider_daily_schedule pds
    CROSS JOIN LATERAL generate_series(
      pds.date + pds.start_time,
      pds.date + pds.end_time - (pds.slot_duration_minutes || ' minutes')::INTERVAL,
      (pds.slot_duration_minutes || ' minutes')::INTERVAL
    ) AS slot_time
  )
  SELECT 
    ts.date AS slot_date,
    ts.start_time AS slot_start_time,
    ts.end_time AS slot_end_time,
    ts.slot_duration_minutes AS duration_minutes
  FROM time_slots ts
  LEFT JOIN appointments a ON (
    a.provider_id = p_provider_id
    AND a.appointment_date = ts.date
    AND a.start_time = ts.start_time
    AND a.status IN ('scheduled', 'confirmed')
    AND (a.is_reschedule_source IS NULL OR a.is_reschedule_source = false)
  )
  WHERE a.id IS NULL  -- Only return slots that don't have existing appointments
  ORDER BY ts.date, ts.start_time;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_available_slots_for_provider(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots_for_provider(UUID, DATE, DATE, TEXT) TO anon;

-- Test the function
DO $$
DECLARE
  test_result RECORD;
  slot_count INTEGER := 0;
BEGIN
  -- Test with a known provider
  FOR test_result IN 
    SELECT * FROM get_available_slots_for_provider(
      '82e5ac4f-8fd0-47d3-9bdf-a51b66044939'::UUID,
      CURRENT_DATE,
      CURRENT_DATE,
      'weight_loss'
    )
  LOOP
    slot_count := slot_count + 1;
  END LOOP;
  
  RAISE NOTICE '✅ Slots function working - found % slots for today', slot_count;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Slots function error: %', SQLERRM;
END $$;

COMMENT ON FUNCTION get_available_slots_for_provider IS 'Returns available appointment slots for a provider excluding rescheduled appointments';