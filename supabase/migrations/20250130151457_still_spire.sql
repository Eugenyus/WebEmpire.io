-- Create checklist_to_roadmap table
CREATE TABLE public.checklist_to_roadmap (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id uuid NOT NULL REFERENCES public.roadmap_tasks(id) ON DELETE CASCADE,
    title text NOT NULL,
    order_index integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_checklist_roadmap_id ON public.checklist_to_roadmap(roadmap_id);

-- Enable RLS
ALTER TABLE public.checklist_to_roadmap ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read access for authenticated users"
    ON public.checklist_to_roadmap
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow insert for admin users"
    ON public.checklist_to_roadmap
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow update for admin users"
    ON public.checklist_to_roadmap
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow delete for admin users"
    ON public.checklist_to_roadmap
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER set_checklist_updated_at
    BEFORE UPDATE ON public.checklist_to_roadmap
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Create checklist_progress table to track user progress
CREATE TABLE public.checklist_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id uuid NOT NULL REFERENCES public.checklist_to_roadmap(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dashboard_id uuid NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
    is_completed boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_checklist_progress UNIQUE (checklist_id, profile_id, dashboard_id)
);

-- Create indexes for better performance
CREATE INDEX idx_checklist_progress_profile ON public.checklist_progress(profile_id);
CREATE INDEX idx_checklist_progress_dashboard ON public.checklist_progress(dashboard_id);
CREATE INDEX idx_checklist_progress_checklist ON public.checklist_progress(checklist_id);

-- Enable RLS
ALTER TABLE public.checklist_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own checklist progress"
    ON public.checklist_progress
    FOR SELECT
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own checklist progress"
    ON public.checklist_progress
    FOR UPDATE
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own checklist progress"
    ON public.checklist_progress
    FOR INSERT
    TO authenticated
    WITH CHECK (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER set_checklist_progress_updated_at
    BEFORE UPDATE ON public.checklist_progress
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();