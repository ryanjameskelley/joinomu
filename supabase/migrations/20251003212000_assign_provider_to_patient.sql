-- Assign provider (uid: 4c5e8c0c-e391-4ec5-a479-d7ef253894e1, id: 6d7b73d5-7872-4519-9fa9-0ec6d2703869) 
-- to patient (uid: 4d0899b5-9814-46dc-aace-dfcf046d5587, id: f20f48ca-be1e-43b0-95fd-20d385c38bc7)

-- Skip this assignment if assigned_provider_id column doesn't exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name = 'assigned_provider_id'
    ) THEN
        UPDATE patients 
        SET assigned_provider_id = '6d7b73d5-7872-4519-9fa9-0ec6d2703869'
        WHERE id = 'f20f48ca-be1e-43b0-95fd-20d385c38bc7';
    ELSE
        RAISE NOTICE 'Skipping provider assignment - assigned_provider_id column does not exist';
    END IF;
END $$;