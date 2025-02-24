-- Drop the status column and its constraint
ALTER TABLE public.roadmap_tasks
DROP COLUMN IF EXISTS status;