-- Add shortcode support for checklist items
CREATE OR REPLACE FUNCTION generate_checklist_short_code()
RETURNS text AS $$
DECLARE
    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result text := '';
    i integer := 0;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to handle checklist shortcodes
CREATE OR REPLACE FUNCTION set_checklist_short_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code text;
BEGIN
    -- If no shortcode exists, generate one
    IF NEW.shortcode IS NULL THEN
        -- Keep trying until we get a unique code
        LOOP
            new_code := generate_checklist_short_code();
            EXIT WHEN NOT EXISTS (
                SELECT 1 
                FROM public.checklist_to_roadmap
                WHERE shortcode = new_code
            );
        END LOOP;
        
        -- Set the shortcode
        NEW.shortcode := new_code;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add shortcode column to checklist_to_roadmap table
ALTER TABLE public.checklist_to_roadmap
ADD COLUMN shortcode text UNIQUE;

-- Create trigger
DROP TRIGGER IF EXISTS set_checklist_short_code_trigger ON public.checklist_to_roadmap;
CREATE TRIGGER set_checklist_short_code_trigger
    BEFORE INSERT OR UPDATE ON public.checklist_to_roadmap
    FOR EACH ROW
    EXECUTE FUNCTION set_checklist_short_code();

-- Update existing checklist items to have shortcodes
DO $$
DECLARE
    checklist_record RECORD;
    new_code text;
BEGIN
    FOR checklist_record IN 
        SELECT id 
        FROM public.checklist_to_roadmap 
        WHERE shortcode IS NULL
    LOOP
        -- Generate unique shortcode
        LOOP
            new_code := generate_checklist_short_code();
            EXIT WHEN NOT EXISTS (
                SELECT 1 
                FROM public.checklist_to_roadmap
                WHERE shortcode = new_code
            );
        END LOOP;

        -- Update the checklist record
        UPDATE public.checklist_to_roadmap 
        SET shortcode = new_code 
        WHERE id = checklist_record.id;
    END LOOP;
END $$;