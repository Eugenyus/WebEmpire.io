-- Drop existing unique constraint
ALTER TABLE public.dashboards DROP CONSTRAINT IF EXISTS unique_profile_interest;

-- Create a function to handle duplicate prevention
CREATE OR REPLACE FUNCTION public.prevent_duplicate_dashboard()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM public.dashboards
        WHERE profile_id = NEW.profile_id 
        AND interest_area = NEW.interest_area
        AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'You already have a dashboard for this interest area';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent duplicates
DROP TRIGGER IF EXISTS prevent_duplicate_dashboard_trigger ON public.dashboards;
CREATE TRIGGER prevent_duplicate_dashboard_trigger
    BEFORE INSERT OR UPDATE ON public.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_duplicate_dashboard();

-- Recreate policies to ensure proper access
DROP POLICY IF EXISTS "Users can view own dashboard" ON public.dashboards;
DROP POLICY IF EXISTS "Users can insert own dashboard" ON public.dashboards;
DROP POLICY IF EXISTS "Users can update own dashboard" ON public.dashboards;
DROP POLICY IF EXISTS "Users can delete own dashboard" ON public.dashboards;

CREATE POLICY "Users can view own dashboard"
    ON public.dashboards
    FOR SELECT
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own dashboard"
    ON public.dashboards
    FOR INSERT
    TO authenticated
    WITH CHECK (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own dashboard"
    ON public.dashboards
    FOR UPDATE
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own dashboard"
    ON public.dashboards
    FOR DELETE
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );