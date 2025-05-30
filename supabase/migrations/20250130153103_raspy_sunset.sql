-- Remove quiz_items from roadmap_tasks
ALTER TABLE public.roadmap_tasks
DROP COLUMN IF EXISTS quiz_items;

-- Drop related indexes if they exist
DROP INDEX IF EXISTS idx_roadmap_tasks_quiz_items;

-- Force a schema cache refresh
SELECT pg_notify('pgrst', 'reload schema');