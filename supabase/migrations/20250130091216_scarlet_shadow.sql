-- Update the status values in roadmap_to_user table
ALTER TABLE public.roadmap_to_user
DROP CONSTRAINT IF EXISTS valid_status;

-- Update existing values
UPDATE public.roadmap_to_user
SET status = 'not_started'
WHERE status = 'pending';

-- Add new constraint
ALTER TABLE public.roadmap_to_user
ADD CONSTRAINT valid_status CHECK (status IN ('not_started', 'in_progress', 'completed'));

-- Update the status values in roadmap_tasks table
ALTER TABLE public.roadmap_tasks
DROP CONSTRAINT IF EXISTS valid_status;

-- Update existing values
UPDATE public.roadmap_tasks
SET status = 'not_started'
WHERE status = 'pending';

-- Add new constraint
ALTER TABLE public.roadmap_tasks
ADD CONSTRAINT valid_status CHECK (status IN ('not_started', 'in_progress', 'completed'));