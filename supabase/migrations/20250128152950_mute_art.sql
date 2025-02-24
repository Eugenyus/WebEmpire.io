/*
  # Create triggers for dashboard roadmap steps

  1. New Functions
    - `handle_dashboard_insert`: Adds roadmap steps when a dashboard is created
    - `handle_dashboard_delete`: Removes roadmap steps when a dashboard is deleted

  2. New Triggers
    - After INSERT on dashboards
    - After DELETE on dashboards
*/

-- Create function to handle dashboard insertion
CREATE OR REPLACE FUNCTION public.handle_dashboard_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert all roadmap tasks for the interest area into roadmap_to_user
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
    WHERE rt.interest_area_id = NEW.interest_area;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for dashboard insertion
DROP TRIGGER IF EXISTS handle_dashboard_insert_trigger ON public.dashboards;
CREATE TRIGGER handle_dashboard_insert_trigger
    AFTER INSERT ON public.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_dashboard_insert();

-- Create function to handle dashboard deletion
CREATE OR REPLACE FUNCTION public.handle_dashboard_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete all roadmap_to_user entries for this dashboard
    -- Note: This is actually not needed because of ON DELETE CASCADE,
    -- but we keep it for clarity and in case the cascade is removed in the future
    DELETE FROM public.roadmap_to_user
    WHERE dashboard_id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for dashboard deletion
DROP TRIGGER IF EXISTS handle_dashboard_delete_trigger ON public.dashboards;
CREATE TRIGGER handle_dashboard_delete_trigger
    BEFORE DELETE ON public.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_dashboard_delete();