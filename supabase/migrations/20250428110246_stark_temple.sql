-- Drop checklist-related tables and functions
DROP TABLE IF EXISTS public.checklist_progress;
DROP TABLE IF EXISTS public.checklist_to_roadmap;
DROP FUNCTION IF EXISTS generate_checklist_short_code();
DROP FUNCTION IF EXISTS set_checklist_short_code();