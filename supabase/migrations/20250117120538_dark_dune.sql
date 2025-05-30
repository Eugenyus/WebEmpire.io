-- Wrap everything in a transaction for safety
BEGIN;

-- Temporarily disable RLS
ALTER TABLE public.dashboards DISABLE ROW LEVEL SECURITY;

-- Create a temporary table to store cleaned data
CREATE TEMP TABLE temp_dashboards AS
SELECT DISTINCT ON (profile_id, interest_area) 
    id,
    profile_id,
    interest_area,
    created_at,
    updated_at
FROM public.dashboards
ORDER BY profile_id, interest_area, created_at DESC;

-- Clear the original table
TRUNCATE public.dashboards;

-- Reinsert the cleaned data
INSERT INTO public.dashboards (id, profile_id, interest_area, created_at, updated_at)
SELECT id, profile_id, interest_area, created_at, updated_at
FROM temp_dashboards;

-- Drop temporary table
DROP TABLE temp_dashboards;

-- Re-enable RLS
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

COMMIT;