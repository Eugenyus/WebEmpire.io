-- Add unique constraint to roadmap_to_user table
ALTER TABLE public.roadmap_to_user
DROP CONSTRAINT IF EXISTS unique_roadmap_to_user;

ALTER TABLE public.roadmap_to_user
ADD CONSTRAINT unique_roadmap_to_user 
UNIQUE (profile_id, dashboard_id, roadmap_id);

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can view own roadmap progress" ON public.roadmap_to_user;
DROP POLICY IF EXISTS "Users can update own roadmap progress" ON public.roadmap_to_user;
DROP POLICY IF EXISTS "Users can insert own roadmap progress" ON public.roadmap_to_user;

-- Recreate policies
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