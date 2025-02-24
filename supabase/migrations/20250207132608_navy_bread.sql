-- Drop the trigger first
DROP TRIGGER IF EXISTS initialize_checklist_items_trigger ON public.roadmap_to_user;

-- Then drop the function
DROP FUNCTION IF EXISTS initialize_checklist_items();

-- Ensure the roadmap_to_user table has the correct structure
ALTER TABLE public.roadmap_to_user
DROP COLUMN IF EXISTS checklist_items;