-- Drop existing trigger and function
DROP TRIGGER IF EXISTS set_video_short_code_trigger ON public.roadmap_tasks;
DROP FUNCTION IF EXISTS set_video_short_code();

-- Create updated trigger function that properly handles jsonb arrays
CREATE OR REPLACE FUNCTION set_video_short_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set short code if there are video links and no short code yet
    IF NEW.video_links IS NOT NULL AND 
       jsonb_array_length(NEW.video_links) > 0 AND 
       NEW.video_short_code IS NULL THEN
        -- Keep trying until we get a unique code
        LOOP
            NEW.video_short_code := generate_video_short_code();
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM public.roadmap_tasks 
                WHERE video_short_code = NEW.video_short_code
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER set_video_short_code_trigger
    BEFORE INSERT OR UPDATE ON public.roadmap_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_video_short_code();