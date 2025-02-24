-- First, let's add some test data to roadmap_tasks if none exists
INSERT INTO public.roadmap_tasks (interest_area_id, title, description, order_index)
SELECT 
    ia.id,
    'Getting Started with ' || ia.title,
    'Introduction to ' || ia.description,
    1
FROM public.interest_areas ia
WHERE NOT EXISTS (
    SELECT 1 FROM public.roadmap_tasks 
    WHERE interest_area_id = ia.id
)
ON CONFLICT DO NOTHING;

-- Update the handle_dashboard_insert function to be more robust
CREATE OR REPLACE FUNCTION public.handle_dashboard_insert()
RETURNS TRIGGER AS $$
DECLARE
    task_count integer;
BEGIN
    -- Log the start of the operation
    INSERT INTO public.debug_logs (operation, details)
    VALUES (
        'dashboard_insert_start',
        jsonb_build_object(
            'profile_id', NEW.profile_id,
            'dashboard_id', NEW.id,
            'interest_area', NEW.interest_area,
            'timestamp', now()
        )
    );

    -- Get count of available tasks
    SELECT count(*) INTO task_count
    FROM public.roadmap_tasks
    WHERE interest_area_id = NEW.interest_area;

    -- Log the task count
    INSERT INTO public.debug_logs (operation, details)
    VALUES (
        'available_tasks',
        jsonb_build_object(
            'interest_area', NEW.interest_area,
            'count', task_count
        )
    );

    -- Insert tasks into roadmap_to_user
    WITH inserted_rows AS (
        INSERT INTO public.roadmap_to_user (
            profile_id,
            dashboard_id,
            roadmap_id,
            status
        )
        SELECT 
            NEW.profile_id,
            NEW.id,
            rt.id,
            'pending'
        FROM public.roadmap_tasks rt
        WHERE rt.interest_area_id = NEW.interest_area
        RETURNING id
    )
    SELECT count(*) INTO task_count
    FROM inserted_rows;

    -- Log the completion
    INSERT INTO public.debug_logs (operation, details)
    VALUES (
        'dashboard_insert_complete',
        jsonb_build_object(
            'dashboard_id', NEW.id,
            'tasks_inserted', task_count,
            'timestamp', now()
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS handle_dashboard_insert_trigger ON public.dashboards;
CREATE TRIGGER handle_dashboard_insert_trigger
    AFTER INSERT ON public.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_dashboard_insert();

-- Grant necessary permissions
GRANT ALL ON public.roadmap_to_user TO authenticated;
GRANT ALL ON public.roadmap_tasks TO authenticated;