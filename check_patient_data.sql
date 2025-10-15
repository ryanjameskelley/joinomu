-- Check existing patient data
-- Patient auth ID: 2aacf4bb-11d4-4eb2-8c78-6969e367c742
-- Patient ID: d9bb10ad-eaa1-4188-ac4c-9bb58048d4c3

-- 1. Check patient medication preferences
SELECT 
  pmp.id as preference_id,
  pmp.patient_id,
  pmp.preferred_dosage,
  pmp.frequency,
  pmp.status,
  m.name as medication_name,
  m.category,
  m.dosage_form,
  m.strength
FROM patient_medication_preferences pmp
JOIN medications m ON pmp.medication_id = m.id
WHERE pmp.patient_id = 'd9bb10ad-eaa1-4188-ac4c-9bb58048d4c3';

-- 2. Check existing tracking entries
SELECT COUNT(*) as tracking_entries_count
FROM medication_tracking_entries 
WHERE patient_id = 'd9bb10ad-eaa1-4188-ac4c-9bb58048d4c3';

-- 3. Check existing health metrics
SELECT COUNT(*) as health_metrics_count
FROM patient_health_metrics 
WHERE patient_id = 'd9bb10ad-eaa1-4188-ac4c-9bb58048d4c3';

-- 4. Check available medications in the system
SELECT 
  id,
  name,
  category,
  dosage_form,
  strength,
  active
FROM medications 
WHERE active = true 
AND (
  LOWER(name) LIKE '%semaglutide%' 
  OR LOWER(name) LIKE '%ozempic%'
  OR LOWER(name) LIKE '%wegovy%'
  OR LOWER(name) LIKE '%mounjaro%'
  OR LOWER(name) LIKE '%tirzepatide%'
)
ORDER BY name;