-- Add status column back to roadmap_tasks
ALTER TABLE public.roadmap_tasks
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Add constraint to ensure valid status values
ALTER TABLE public.roadmap_tasks
ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed'));

-- Update existing rows to have a valid status if needed
UPDATE public.roadmap_tasks
SET status = 'pending'
WHERE status IS NULL OR status NOT IN ('pending', 'in_progress', 'completed');

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_roadmap_tasks_status ON public.roadmap_tasks(status);

-- Grant necessary permissions
GRANT ALL ON public.roadmap_tasks TO authenticated;

-- Ensure RLS policies are updated to handle status column
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.roadmap_tasks;
CREATE POLICY "Allow update for authenticated users"
    ON public.roadmap_tasks
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.roadmap_to_user rtu
            JOIN public.profiles p ON p.id = rtu.profile_id
            WHERE p.user_id = auth.uid()
            AND rtu.roadmap_id = roadmap_tasks.id
        )
    );