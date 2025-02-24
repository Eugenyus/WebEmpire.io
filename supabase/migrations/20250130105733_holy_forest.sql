-- Drop the status column and its constraint from roadmap_tasks
ALTER TABLE public.roadmap_tasks
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE public.roadmap_tasks
DROP COLUMN IF EXISTS status;