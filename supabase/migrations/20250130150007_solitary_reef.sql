-- Drop existing checklist_items column to ensure clean state
ALTER TABLE public.roadmap_to_user
DROP COLUMN IF EXISTS checklist_items;

-- Add checklist_items column with proper type and default
ALTER TABLE public.roadmap_to_user
ADD COLUMN checklist_items jsonb DEFAULT '[]'::jsonb;

-- Create index for better performance
DROP INDEX IF EXISTS idx_roadmap_to_user_checklist_items;
CREATE INDEX idx_roadmap_to_user_checklist_items ON public.roadmap_to_user USING GIN (checklist_items);

-- Add function to initialize checklist items
CREATE OR REPLACE FUNCTION initialize_checklist_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Initialize checklist_items if it's NULL or empty
    IF NEW.checklist_items IS NULL OR NEW.checklist_items = '[]'::jsonb THEN
        NEW.checklist_items = (
            SELECT jsonb_agg(jsonb_build_object('completed', false))
            FROM unnest(ARRAY(
                SELECT jsonb_array_length(to_jsonb(rt.checklist_items))
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

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view own roadmap progress" ON public.roadmap_to_user;
DROP POLICY IF EXISTS "Users can update own roadmap progress" ON public.roadmap_to_user;

CREATE POLICY "Users can view own roadmap progress"
    ON public.roadmap_to_user
    FOR SELECT
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own roadmap progress"
    ON public.roadmap_to_user
    FOR UPDATE
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Add upsert policy
CREATE POLICY "Users can upsert own roadmap progress"
    ON public.roadmap_to_user
    FOR INSERT
    TO authenticated
    WITH CHECK (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );