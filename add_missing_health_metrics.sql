-- Add missing health metrics data for protein, sugar, water, and heart rate
-- Patient ID: d9bb10ad-eaa1-4188-ac4c-9bb58048d4c3

-- Generate realistic protein data (80-160 grams, trending up)
INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
SELECT 
  'd9bb10ad-eaa1-4188-ac4c-9bb58048d4c3' as patient_id,
  'protein' as metric_type,
  (90 + (extract(epoch from date_series - '2024-01-18'::date) / 86400 * 0.05) + (random() - 0.5) * 40)::integer as value,
  'grams' as unit,
  date_series as recorded_at,
  'manual' as synced_from
FROM generate_series('2024-01-18'::date, '2024-10-14'::date, '1 day'::interval) as date_series
WHERE random() < 0.7; -- 70% frequency

-- Generate realistic sugar data (20-80 grams, trending down)  
INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
SELECT 
  'd9bb10ad-eaa1-4188-ac4c-9bb58048d4c3' as patient_id,
  'sugar' as metric_type,
  GREATEST(15, LEAST(100, (60 - (extract(epoch from date_series - '2024-01-18'::date) / 86400 * 0.03) + (random() - 0.5) * 30)::integer)) as value,
  'grams' as unit,
  date_series as recorded_at,
  'manual' as synced_from
FROM generate_series('2024-01-18'::date, '2024-10-14'::date, '1 day'::interval) as date_series
WHERE random() < 0.7;

-- Generate realistic water data (40-100 fl oz, trending up)
INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
SELECT 
  'd9bb10ad-eaa1-4188-ac4c-9bb58048d4c3' as patient_id,
  'water' as metric_type,
  GREATEST(32, LEAST(120, (50 + (extract(epoch from date_series - '2024-01-18'::date) / 86400 * 0.02) + (random() - 0.5) * 20)::integer)) as value,
  'fl oz' as unit,
  date_series as recorded_at,
  'manual' as synced_from
FROM generate_series('2024-01-18'::date, '2024-10-14'::date, '1 day'::interval) as date_series
WHERE random() < 0.7;

-- Generate realistic heart rate data (55-90 bpm, trending down as fitness improves)
INSERT INTO patient_health_metrics (patient_id, metric_type, value, unit, recorded_at, synced_from)
SELECT 
  'd9bb10ad-eaa1-4188-ac4c-9bb58048d4c3' as patient_id,
  'heart_rate' as metric_type,
  GREATEST(55, LEAST(90, (78 - (extract(epoch from date_series - '2024-01-18'::date) / 86400 * 0.01) + (random() - 0.5) * 12)::integer)) as value,
  'bpm' as unit,
  date_series as recorded_at,
  'manual' as synced_from
FROM generate_series('2024-01-18'::date, '2024-10-14'::date, '1 day'::interval) as date_series
WHERE random() < 0.7;

-- Verify the data was inserted
SELECT metric_type, COUNT(*) as count
FROM patient_health_metrics 
WHERE patient_id = 'd9bb10ad-eaa1-4188-ac4c-9bb58048d4c3'
  AND metric_type IN ('protein', 'sugar', 'water', 'heart_rate')
GROUP BY metric_type
ORDER BY metric_type;