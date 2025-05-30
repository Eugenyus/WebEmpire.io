-- Create a logging table
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operation text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- Update the handle_dashboard_insert function with logging
CREATE OR REPLACE FUNCTION public.handle_dashboard_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the trigger execution
    INSERT INTO public.debug_logs (operation, details)
    VALUES (
        'dashboard_insert_trigger',
        jsonb_build_object(
            'profile_id', NEW.profile_id,
            'dashboard_id', NEW.id,
            'interest_area', NEW.interest_area
        )
    );

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

    -- Log the number of tasks inserted
    INSERT INTO public.debug_logs (operation, details)
    VALUES (
        'tasks_inserted',
        jsonb_build_object(
            'dashboard_id', NEW.id,
            'count', (SELECT count(*) FROM public.roadmap_tasks WHERE interest_area_id = NEW.interest_area)
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it's properly set
DROP TRIGGER IF EXISTS handle_dashboard_insert_trigger ON public.dashboards;
CREATE TRIGGER handle_dashboard_insert_trigger
    AFTER INSERT ON public.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_dashboard_insert();

-- Grant permissions for the debug_logs table
GRANT ALL ON public.debug_logs TO authenticated;
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for debug_logs
CREATE POLICY "Allow all access to debug_logs for authenticated users"
    ON public.debug_logs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);