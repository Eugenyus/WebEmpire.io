-- Drop existing trigger and function
DROP TRIGGER IF EXISTS set_video_short_code_trigger ON public.roadmap_tasks;
DROP FUNCTION IF EXISTS set_video_short_code();

-- Create updated trigger function that handles shortcodes per video
CREATE OR REPLACE FUNCTION set_video_short_code()
RETURNS TRIGGER AS $$
DECLARE
    new_links jsonb;
    link jsonb;
    new_code text;
BEGIN
    -- Only process if there are video links
    IF NEW.video_links IS NOT NULL AND jsonb_array_length(NEW.video_links) > 0 THEN
        new_links := '[]'::jsonb;
        
        -- Process each video link
        FOR link IN SELECT * FROM jsonb_array_elements(NEW.video_links)
        LOOP
            -- If the link doesn't have a shortcode, generate one
            IF link->>'shortcode' IS NULL THEN
                -- Keep trying until we get a unique code
                LOOP
                    new_code := generate_video_short_code();
                    EXIT WHEN NOT EXISTS (
                        SELECT 1 
                        FROM public.roadmap_tasks,
                        jsonb_array_elements(video_links) as link
                        WHERE link->>'shortcode' = new_code
                    );
                END LOOP;
                
                -- Add shortcode to the link object
                link := link || jsonb_build_object('shortcode', new_code);
            END IF;
            
            -- Add the link (with or without new shortcode) to the array
            new_links := new_links || jsonb_build_array(link);
        END LOOP;
        
        -- Update the video_links with the new array
        NEW.video_links := new_links;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER set_video_short_code_trigger
    BEFORE INSERT OR UPDATE ON public.roadmap_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_video_short_code();

-- Update existing video links to add shortcodes
DO $$
DECLARE
    task_record RECORD;
    new_links jsonb;
    link jsonb;
    new_code text;
BEGIN
    FOR task_record IN 
        SELECT id, video_links 
        FROM public.roadmap_tasks 
        WHERE video_links IS NOT NULL 
        AND jsonb_array_length(video_links) > 0
    LOOP
        new_links := '[]'::jsonb;
        
        FOR link IN SELECT * FROM jsonb_array_elements(task_record.video_links)
        LOOP
            IF link->>'shortcode' IS NULL THEN
                LOOP
                    new_code := generate_video_short_code();
                    EXIT WHEN NOT EXISTS (
                        SELECT 1 
                        FROM public.roadmap_tasks,
                        jsonb_array_elements(video_links) as l
                        WHERE l->>'shortcode' = new_code
                    );
                END LOOP;
                
                link := link || jsonb_build_object('shortcode', new_code);
            END IF;
            
            new_links := new_links || jsonb_build_array(link);
        END LOOP;
        
        UPDATE public.roadmap_tasks 
        SET video_links = new_links 
        WHERE id = task_record.id;
    END LOOP;
END $$;