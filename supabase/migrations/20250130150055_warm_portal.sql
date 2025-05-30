-- Drop existing checklist_items column to ensure clean state
ALTER TABLE public.roadmap_to_user
DROP COLUMN IF EXISTS checklist_items;

-- Add checklist_items column with proper type and default
ALTER TABLE public.roadmap_to_user
ADD COLUMN checklist_items boolean[] DEFAULT ARRAY[]::boolean[];

-- Create index for better performance
DROP INDEX IF EXISTS idx_roadmap_to_user_checklist_items;
CREATE INDEX idx_roadmap_to_user_checklist_items ON public.roadmap_to_user USING GIN (checklist_items);

-- Add function to initialize checklist items
CREATE OR REPLACE FUNCTION initialize_checklist_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Initialize checklist_items if it's NULL or empty
    IF NEW.checklist_items IS NULL OR array_length(NEW.checklist_items, 1) IS NULL THEN
        NEW.checklist_items = (
            SELECT array_agg(false)
            FROM unnest(ARRAY(
                SELECT array_length(rt.checklist_items, 1)
                FROM roadmap_tasks rt
                WHERE rt.id = NEW.roadmap_id
            )) WITH ORDINALITY AS t(len, ord)
            WHERE len > 0
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for initialization
DROP TRIGGER IF EXISTS initialize_checklist_items_trigger ON public.roadmap_to_user;
CREATE TRIGGER initialize_checklist_items_trigger
    BEFORE INSERT OR UPDATE ON public.roadmap_to_user
    FOR EACH ROW
    EXECUTE FUNCTION initialize_checklist_items();