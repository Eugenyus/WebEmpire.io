-- Add checklist_items column to roadmap_tasks table
ALTER TABLE public.roadmap_tasks
ADD COLUMN IF NOT EXISTS checklist_items text[] DEFAULT ARRAY[]::text[];

-- Create an index for better performance when querying checklist items
CREATE INDEX IF NOT EXISTS idx_roadmap_tasks_checklist_items ON public.roadmap_tasks USING GIN (checklist_items);

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.roadmap_tasks;
DROP POLICY IF EXISTS "Allow insert for admin users" ON public.roadmap_tasks;
DROP POLICY IF EXISTS "Allow update for admin users" ON public.roadmap_tasks;
DROP POLICY IF EXISTS "Allow delete for admin users" ON public.roadmap_tasks;

-- Recreate policies with checklist_items access
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