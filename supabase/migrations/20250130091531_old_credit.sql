-- Update the status values in roadmap_to_user table
ALTER TABLE public.roadmap_to_user
DROP CONSTRAINT IF EXISTS valid_status;

-- Add new constraint with skipped status
ALTER TABLE public.roadmap_to_user
ADD CONSTRAINT valid_status CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped'));

-- Update the status values in roadmap_tasks table
ALTER TABLE public.roadmap_tasks
DROP CONSTRAINT IF EXISTS valid_status;

-- Add new constraint with skipped status
ALTER TABLE public.roadmap_tasks
ADD CONSTRAINT valid_status CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped'));