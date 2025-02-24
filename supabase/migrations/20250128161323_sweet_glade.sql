-- First create the debug_logs table
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operation text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

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

-- Update the handle_dashboard_insert function to be more robust
CREATE OR REPLACE FUNCTION public.handle_dashboard_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert tasks into roadmap_to_user
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

    -- Log the operation after successful insertion
    INSERT INTO public.debug_logs (operation, details)
    VALUES (
        'dashboard_insert_complete',
        jsonb_build_object(
            'dashboard_id', NEW.id,
            'tasks_inserted', (SELECT count(*) FROM public.roadmap_to_user WHERE dashboard_id = NEW.id),
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

-- Add some test data to roadmap_tasks if none exists
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