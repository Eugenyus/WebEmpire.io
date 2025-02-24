-- First, ensure checklist_items has the correct type
ALTER TABLE public.roadmap_to_user
DROP COLUMN IF EXISTS checklist_items;

ALTER TABLE public.roadmap_to_user
ADD COLUMN checklist_items jsonb DEFAULT '[]'::jsonb;

-- Create index for better performance
DROP INDEX IF EXISTS idx_roadmap_to_user_checklist_items;
CREATE INDEX idx_roadmap_to_user_checklist_items ON public.roadmap_to_user USING GIN (checklist_items);

-- Add unique constraint to prevent duplicate entries
ALTER TABLE public.roadmap_to_user
DROP CONSTRAINT IF EXISTS unique_user_roadmap;

ALTER TABLE public.roadmap_to_user
ADD CONSTRAINT unique_user_roadmap UNIQUE (profile_id, dashboard_id, roadmap_id);