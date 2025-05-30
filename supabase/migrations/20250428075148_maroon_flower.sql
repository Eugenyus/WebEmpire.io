-- Add short_code column to roadmap_tasks table
ALTER TABLE public.roadmap_tasks
ADD COLUMN video_short_code text;

-- Create unique index for short_code
CREATE UNIQUE INDEX idx_roadmap_tasks_short_code ON public.roadmap_tasks(video_short_code) WHERE video_short_code IS NOT NULL;

-- Create function to generate random short code
CREATE OR REPLACE FUNCTION generate_video_short_code()
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

-- Create trigger to automatically generate short code for new videos
CREATE OR REPLACE FUNCTION set_video_short_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set short code if there are video links and no short code yet
    IF NEW.video_links IS NOT NULL AND 
       array_length(NEW.video_links, 1) > 0 AND 
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

-- Create trigger
CREATE TRIGGER set_video_short_code_trigger
    BEFORE INSERT OR UPDATE ON public.roadmap_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_video_short_code();