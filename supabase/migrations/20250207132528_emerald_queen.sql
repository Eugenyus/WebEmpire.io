-- First, create a temporary table to store the latest status for each combination
CREATE TEMP TABLE temp_roadmap_status AS
SELECT DISTINCT ON (profile_id, dashboard_id, roadmap_id)
    profile_id,
    dashboard_id,
    roadmap_id,
    status,
    created_at,
    updated_at
FROM public.roadmap_to_user
ORDER BY profile_id, dashboard_id, roadmap_id, updated_at DESC;

-- Clear the original table
TRUNCATE public.roadmap_to_user;

-- Reinsert the deduplicated data
INSERT INTO public.roadmap_to_user (
    profile_id,
    dashboard_id,
    roadmap_id,
    status,
    created_at,
    updated_at
)
SELECT 
    profile_id,
    dashboard_id,
    roadmap_id,
    status,
    created_at,
    updated_at
FROM temp_roadmap_status;

-- Now add the unique constraint
ALTER TABLE public.roadmap_to_user
ADD CONSTRAINT unique_roadmap_to_user 
UNIQUE (profile_id, dashboard_id, roadmap_id);

-- Drop the temporary table
DROP TABLE temp_roadmap_status;