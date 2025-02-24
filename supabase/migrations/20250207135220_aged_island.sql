-- Create a function to check if this is the user's last dashboard
CREATE OR REPLACE FUNCTION public.check_last_dashboard()
RETURNS TRIGGER AS $$
DECLARE
    dashboard_count INTEGER;
BEGIN
    -- Count remaining dashboards for this profile
    SELECT COUNT(*)
    INTO dashboard_count
    FROM public.dashboards
    WHERE profile_id = OLD.profile_id
    AND id != OLD.id;

    -- If this is the last dashboard, prevent deletion
    IF dashboard_count = 0 THEN
        RAISE EXCEPTION 'Cannot delete the last dashboard';
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent deletion of last dashboard
DROP TRIGGER IF EXISTS prevent_last_dashboard_deletion ON public.dashboards;
CREATE TRIGGER prevent_last_dashboard_deletion
    BEFORE DELETE ON public.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION public.check_last_dashboard();