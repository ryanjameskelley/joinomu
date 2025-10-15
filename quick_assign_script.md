# Quick Provider-Patient Assignment Script

## Usage Instructions

1. **Find the auth UIDs** (profile_ids):
   - Log in as provider → check browser console: `auth.getUser().then(r => console.log('Provider:', r.data.user.id))`
   - Log in as patient → check browser console: `auth.getUser().then(r => console.log('Patient:', r.data.user.id))`
   
   OR run this SQL to see all available users:
   ```sql
   SELECT 'PROVIDER' as type, profile_id, id FROM providers
   UNION ALL
   SELECT 'PATIENT' as type, profile_id, id FROM patients;
   ```

2. **Edit the template file** `assign_provider_to_patient_template.sql`:
   - Replace `REPLACE_WITH_PROVIDER_AUTH_UID` with actual provider auth UID
   - Replace `REPLACE_WITH_PATIENT_AUTH_UID` with actual patient auth UID

3. **Run the assignment**:
   ```bash
   # Create migration file
   cp assign_provider_to_patient_template.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_assign_provider_patient.sql
   
   # Apply the migration
   npx supabase migration up
   ```

## Current Known IDs (from today's session)
- **Provider**: profile_id = `ccabc2d7-037e-4410-ae15-8ad673f0f7e1`
- **Patient**: profile_id = `6a2ffaa8-318b-4888-a102-1277708d6b9a`

## Quick One-Liner for Current Users
```sql
-- For current known users, run this directly:
WITH provider_lookup AS (SELECT id FROM providers WHERE profile_id = 'ccabc2d7-037e-4410-ae15-8ad673f0f7e1'),
patient_lookup AS (SELECT id FROM patients WHERE profile_id = '6a2ffaa8-318b-4888-a102-1277708d6b9a')
INSERT INTO patient_assignments (provider_id, patient_id, treatment_type, is_primary, active, assigned_date)
SELECT p.id, pt.id, 'weight_loss', true, true, NOW()
FROM provider_lookup p, patient_lookup pt
WHERE NOT EXISTS (SELECT 1 FROM patient_assignments pa WHERE pa.provider_id = p.id AND pa.patient_id = pt.id);
```

This eliminates the need to search for IDs and troubleshoot migrations every time you need to assign a provider to a patient.