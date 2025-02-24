-- Add quiz_items column to roadmap_tasks table
ALTER TABLE public.roadmap_tasks
ADD COLUMN IF NOT EXISTS quiz_items jsonb[] DEFAULT ARRAY[]::jsonb[];

-- Create an index for better performance when querying quiz items
CREATE INDEX IF NOT EXISTS idx_roadmap_tasks_quiz_items ON public.roadmap_tasks USING GIN (quiz_items);

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