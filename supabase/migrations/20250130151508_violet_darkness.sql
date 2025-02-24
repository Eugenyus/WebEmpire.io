-- Remove old checklist columns and related objects
ALTER TABLE public.roadmap_tasks
DROP COLUMN IF EXISTS checklist_items;

ALTER TABLE public.roadmap_to_user
DROP COLUMN IF EXISTS checklist_items;

DROP INDEX IF EXISTS idx_roadmap_tasks_checklist_items;
DROP INDEX IF EXISTS idx_roadmap_to_user_checklist_items;

DROP FUNCTION IF EXISTS initialize_checklist_items();
DROP TRIGGER IF EXISTS initialize_checklist_items_trigger ON public.roadmap_to_user;