-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access for all authenticated users" ON public.interest_areas;
DROP POLICY IF EXISTS "Allow insert for authenticated admin users" ON public.interest_areas;
DROP POLICY IF EXISTS "Allow update for authenticated admin users" ON public.interest_areas;
DROP POLICY IF EXISTS "Allow delete for authenticated admin users" ON public.interest_areas;

-- Enable RLS
ALTER TABLE public.interest_areas ENABLE ROW LEVEL SECURITY;

-- Create read policy (allow all authenticated users to read)
CREATE POLICY "Allow read access for all authenticated users"
    ON public.interest_areas
    FOR SELECT
    TO authenticated
    USING (true);

-- Create insert policy (only for admin users)
CREATE POLICY "Allow insert for authenticated admin users"
    ON public.interest_areas
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            JOIN public.profiles ON auth.users.id = profiles.user_id
            WHERE auth.users.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create update policy (only for admin users)
CREATE POLICY "Allow update for authenticated admin users"
    ON public.interest_areas
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            JOIN public.profiles ON auth.users.id = profiles.user_id
            WHERE auth.users.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create delete policy (only for admin users)
CREATE POLICY "Allow delete for authenticated admin users"
    ON public.interest_areas
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            JOIN public.profiles ON auth.users.id = profiles.user_id
            WHERE auth.users.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );