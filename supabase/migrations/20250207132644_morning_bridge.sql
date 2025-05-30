-- First, create a temporary table to store the latest status for each combination
CREATE TEMP TABLE temp_roadmap_status AS
SELECT DISTINCT ON (profile_id, dashboard_id, roadmap_id)
    id,
    profile_id,
    dashboard_id,
    roadmap_id,
    status,
    created_at,
    updated_at
FROM public.roadmap_to_user
ORDER BY profile_id, dashboard_id, roadmap_id, updated_at DESC;

-- Drop existing constraint if it exists
ALTER TABLE public.roadmap_to_user
DROP CONSTRAINT IF EXISTS unique_roadmap_to_user;

-- Clear the original table
TRUNCATE public.roadmap_to_user;

-- Reinsert the deduplicated data
INSERT INTO public.roadmap_to_user (
    id,
    profile_id,
    dashboard_id,
    roadmap_id,
    status,
    created_at,
    updated_at
)
SELECT 
    id,
    profile_id,
    dashboard_id,
    roadmap_id,
    status,
    created_at,
    updated_at
FROM temp_roadmap_status;

-- Add the unique constraint
ALTER TABLE public.roadmap_to_user
ADD CONSTRAINT unique_roadmap_to_user 
UNIQUE (profile_id, dashboard_id, roadmap_id);

-- Drop the temporary table
DROP TABLE temp_roadmap_status;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view own roadmap progress" ON public.roadmap_to_user;
DROP POLICY IF EXISTS "Users can update own roadmap progress" ON public.roadmap_to_user;
DROP POLICY IF EXISTS "Users can insert own roadmap progress" ON public.roadmap_to_user;

-- Recreate policies with proper permissions
CREATE POLICY "Users can view own roadmap progress"
    ON public.roadmap_to_user
    FOR SELECT
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own roadmap progress"
    ON public.roadmap_to_user
    FOR UPDATE
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own roadmap progress"
    ON public.roadmap_to_user
    FOR INSERT
    TO authenticated
    WITH CHECK (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );