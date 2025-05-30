-- First drop the view that depends on the column
DROP VIEW IF EXISTS roadmap_tasks_view;

-- Then drop the not-null constraint on interest_area_id
ALTER TABLE public.roadmap_tasks
ALTER COLUMN interest_area_id DROP NOT NULL;

-- Drop the column since we're using module_id now
ALTER TABLE public.roadmap_tasks
DROP COLUMN interest_area_id;

-- Make module_id required since it's our new foreign key
ALTER TABLE public.roadmap_tasks
ALTER COLUMN module_id SET NOT NULL;