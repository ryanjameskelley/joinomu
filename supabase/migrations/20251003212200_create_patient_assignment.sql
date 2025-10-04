-- Create patient assignment in patient_assignments table
-- Provider: uid 4c5e8c0c-e391-4ec5-a479-d7ef253894e1, id 6d7b73d5-7872-4519-9fa9-0ec6d2703869
-- Patient: uid 4d0899b5-9814-46dc-aace-dfcf046d5587, id f20f48ca-be1e-43b0-95fd-20d385c38bc7

INSERT INTO patient_assignments (
    id,
    patient_id,
    provider_id,
    assigned_at,
    status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'f20f48ca-be1e-43b0-95fd-20d385c38bc7',
    '6d7b73d5-7872-4519-9fa9-0ec6d2703869',
    NOW(),
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (patient_id, provider_id) DO UPDATE SET
    status = 'active',
    assigned_at = NOW(),
    updated_at = NOW();