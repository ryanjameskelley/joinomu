-- Count rows in patient_assignments for this specific assignment
SELECT COUNT(*) as assignment_count
FROM patient_assignments 
WHERE patient_id = 'f20f48ca-be1e-43b0-95fd-20d385c38bc7'
  AND provider_id = '6d7b73d5-7872-4519-9fa9-0ec6d2703869';