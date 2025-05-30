-- Add shortcode support for quiz items
CREATE OR REPLACE FUNCTION generate_quiz_short_code()
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

-- Create trigger function to handle quiz shortcodes
CREATE OR REPLACE FUNCTION set_quiz_short_code()
RETURNS TRIGGER AS $$
DECLARE
    new_options jsonb;
    option jsonb;
    new_code text;
BEGIN
    -- Only process if there are options
    IF NEW.options IS NOT NULL AND jsonb_array_length(NEW.options) > 0 THEN
        -- If no shortcode exists, generate one
        IF NEW.shortcode IS NULL THEN
            -- Keep trying until we get a unique code
            LOOP
                new_code := generate_quiz_short_code();
                EXIT WHEN NOT EXISTS (
                    SELECT 1 
                    FROM public.quiz_to_roadmap
                    WHERE shortcode = new_code
                );
            END LOOP;
            
            -- Set the shortcode
            NEW.shortcode := new_code;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add shortcode column to quiz_to_roadmap table
ALTER TABLE public.quiz_to_roadmap
ADD COLUMN shortcode text UNIQUE;

-- Create trigger
DROP TRIGGER IF EXISTS set_quiz_short_code_trigger ON public.quiz_to_roadmap;
CREATE TRIGGER set_quiz_short_code_trigger
    BEFORE INSERT OR UPDATE ON public.quiz_to_roadmap
    FOR EACH ROW
    EXECUTE FUNCTION set_quiz_short_code();

-- Update existing quiz items to have shortcodes
DO $$
DECLARE
    quiz_record RECORD;
    new_code text;
BEGIN
    FOR quiz_record IN 
        SELECT id 
        FROM public.quiz_to_roadmap 
        WHERE shortcode IS NULL
    LOOP
        -- Generate unique shortcode
        LOOP
            new_code := generate_quiz_short_code();
            EXIT WHEN NOT EXISTS (
                SELECT 1 
                FROM public.quiz_to_roadmap
                WHERE shortcode = new_code
            );
        END LOOP;

        -- Update the quiz record
        UPDATE public.quiz_to_roadmap 
        SET shortcode = new_code 
        WHERE id = quiz_record.id;
    END LOOP;
END $$;