-- First, ensure the column exists with proper type
DO $$ 
BEGIN
    -- Drop the column if it exists to ensure clean state
    ALTER TABLE public.roadmap_tasks 
    DROP COLUMN IF EXISTS checklist_items;

    -- Add the column with proper type and default
    ALTER TABLE public.roadmap_tasks
    ADD COLUMN checklist_items text[] DEFAULT ARRAY[]::text[];
END $$;

-- Recreate the index
DROP INDEX IF EXISTS idx_roadmap_tasks_checklist_items;
CREATE INDEX idx_roadmap_tasks_checklist_items ON public.roadmap_tasks USING GIN (checklist_items);

-- Force a schema cache refresh
SELECT pg_notify('pgrst', 'reload schema');

-- Grant proper permissions
GRANT ALL ON public.roadmap_tasks TO authenticated;
GRANT ALL ON public.roadmap_tasks TO anon;

-- Ensure RLS policies are up to date
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.roadmap_tasks;
DROP POLICY IF EXISTS "Allow insert for admin users" ON public.roadmap_tasks;
DROP POLICY IF EXISTS "Allow update for admin users" ON public.roadmap_tasks;
DROP POLICY IF EXISTS "Allow delete for admin users" ON public.roadmap_tasks;

-- Recreate policies
CREATE POLICY "Allow read access for authenticated users"
    ON public.roadmap_tasks
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow insert for admin users"
    ON public.roadmap_tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow update for admin users"
    ON public.roadmap_tasks
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow delete for admin users"
    ON public.roadmap_tasks
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );