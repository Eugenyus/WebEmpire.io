-- Create user_calendar table
CREATE TABLE public.user_calendar (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dashboard_id uuid NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    date timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_user_calendar_profile ON public.user_calendar(profile_id);
CREATE INDEX idx_user_calendar_dashboard ON public.user_calendar(dashboard_id);
CREATE INDEX idx_user_calendar_date ON public.user_calendar(date);

-- Enable Row Level Security
ALTER TABLE public.user_calendar ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own calendar entries"
    ON public.user_calendar
    FOR SELECT
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own calendar entries"
    ON public.user_calendar
    FOR INSERT
    TO authenticated
    WITH CHECK (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own calendar entries"
    ON public.user_calendar
    FOR UPDATE
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own calendar entries"
    ON public.user_calendar
    FOR DELETE
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER set_user_calendar_updated_at
    BEFORE UPDATE ON public.user_calendar
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();