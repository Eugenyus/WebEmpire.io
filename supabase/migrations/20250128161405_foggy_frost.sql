-- Update the handle_dashboard_insert function to be more resilient
CREATE OR REPLACE FUNCTION public.handle_dashboard_insert()
RETURNS TRIGGER AS $$
DECLARE
    inserted_count integer;
BEGIN
    -- Start transaction
    BEGIN
        -- Insert tasks into roadmap_to_user
        WITH inserted AS (
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
        SELECT count(*) INTO inserted_count FROM inserted;

        -- Only log if we successfully inserted tasks
        IF inserted_count > 0 THEN
            INSERT INTO public.debug_logs (operation, details)
            VALUES (
                'dashboard_insert_complete',
                jsonb_build_object(
                    'dashboard_id', NEW.id,
                    'tasks_inserted', inserted_count,
                    'timestamp', now()
                )
            );
        END IF;

        RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't prevent the dashboard creation
        INSERT INTO public.debug_logs (operation, details)
        VALUES (
            'dashboard_insert_error',
            jsonb_build_object(
                'dashboard_id', NEW.id,
                'error', SQLERRM,
                'timestamp', now()
            )
        );
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS handle_dashboard_insert_trigger ON public.dashboards;
CREATE TRIGGER handle_dashboard_insert_trigger
    AFTER INSERT ON public.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_dashboard_insert();