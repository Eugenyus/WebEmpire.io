-- First, create the debug_logs table
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

-- Create the roadmap_to_user table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roadmap_to_user (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dashboard_id uuid NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
    roadmap_id uuid NOT NULL REFERENCES public.roadmap_tasks(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_roadmap_to_user_profile ON public.roadmap_to_user(profile_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_to_user_dashboard ON public.roadmap_to_user(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_to_user_roadmap ON public.roadmap_to_user(roadmap_id);

-- Enable Row Level Security
ALTER TABLE public.roadmap_to_user ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own roadmap progress"
    ON public.roadmap_to_user
    FOR SELECT
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own roadmap progress"
    ON public.roadmap_to_user
    FOR UPDATE
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Update the handle_dashboard_insert function
CREATE OR REPLACE FUNCTION public.handle_dashboard_insert()
RETURNS TRIGGER AS $$
DECLARE
    task_count integer;
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
    SELECT count(*) INTO task_count FROM inserted;

    -- Log the operation
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or recreate the trigger
DROP TRIGGER IF EXISTS handle_dashboard_insert_trigger ON public.dashboards;
CREATE TRIGGER handle_dashboard_insert_trigger
    AFTER INSERT ON public.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_dashboard_insert();