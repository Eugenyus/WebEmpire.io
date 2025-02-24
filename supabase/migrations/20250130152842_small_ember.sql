-- Remove checklist_items from roadmap_tasks
ALTER TABLE public.roadmap_tasks
DROP COLUMN IF EXISTS checklist_items;

-- Drop related indexes if they exist
DROP INDEX IF EXISTS idx_roadmap_tasks_checklist_items;

-- Force a schema cache refresh
SELECT pg_notify('pgrst', 'reload schema');