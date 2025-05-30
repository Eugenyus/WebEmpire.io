-- First, drop the not-null constraint on interest_area_id
ALTER TABLE public.roadmap_tasks
ALTER COLUMN interest_area_id DROP NOT NULL;

-- Then drop the column since we're using module_id now
ALTER TABLE public.roadmap_tasks
DROP COLUMN interest_area_id;

-- Make module_id required since it's our new foreign key
ALTER TABLE public.roadmap_tasks
ALTER COLUMN module_id SET NOT NULL;