-- Create quiz_to_roadmap table
CREATE TABLE public.quiz_to_roadmap (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id uuid NOT NULL REFERENCES public.roadmap_tasks(id) ON DELETE CASCADE,
    question text NOT NULL,
    options jsonb NOT NULL DEFAULT '[]'::jsonb,
    correct_answer integer NOT NULL,
    explanation text,
    order_index integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_quiz_roadmap_id ON public.quiz_to_roadmap(roadmap_id);

-- Enable RLS
ALTER TABLE public.quiz_to_roadmap ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read access for authenticated users"
    ON public.quiz_to_roadmap
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow insert for admin users"
    ON public.quiz_to_roadmap
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
    ON public.quiz_to_roadmap
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
    ON public.quiz_to_roadmap
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
CREATE TRIGGER set_quiz_updated_at
    BEFORE UPDATE ON public.quiz_to_roadmap
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Create quiz_progress table to track user progress
CREATE TABLE public.quiz_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id uuid NOT NULL REFERENCES public.quiz_to_roadmap(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dashboard_id uuid NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
    selected_answer integer,
    is_correct boolean,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_quiz_progress UNIQUE (quiz_id, profile_id, dashboard_id)
);

-- Create indexes for better performance
CREATE INDEX idx_quiz_progress_profile ON public.quiz_progress(profile_id);
CREATE INDEX idx_quiz_progress_dashboard ON public.quiz_progress(dashboard_id);
CREATE INDEX idx_quiz_progress_quiz ON public.quiz_progress(quiz_id);

-- Enable RLS
ALTER TABLE public.quiz_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own quiz progress"
    ON public.quiz_progress
    FOR SELECT
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own quiz progress"
    ON public.quiz_progress
    FOR UPDATE
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own quiz progress"
    ON public.quiz_progress
    FOR INSERT
    TO authenticated
    WITH CHECK (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER set_quiz_progress_updated_at
    BEFORE UPDATE ON public.quiz_progress
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();