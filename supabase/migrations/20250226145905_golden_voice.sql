-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create new non-recursive policies
CREATE POLICY "allow_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR 
    role = 'admin'
);

CREATE POLICY "allow_insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "allow_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "allow_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Drop existing policies for dashboards
DROP POLICY IF EXISTS "Users can view own dashboard" ON public.dashboards;
DROP POLICY IF EXISTS "Users can insert own dashboard" ON public.dashboards;
DROP POLICY IF EXISTS "Users can update own dashboard" ON public.dashboards;
DROP POLICY IF EXISTS "Users can delete own dashboard" ON public.dashboards;

-- Create new non-recursive policies for dashboards
CREATE POLICY "allow_select_dashboard"
ON public.dashboards
FOR SELECT
TO authenticated
USING (
    profile_id IN (
        SELECT id FROM public.profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "allow_insert_dashboard"
ON public.dashboards
FOR INSERT
TO authenticated
WITH CHECK (
    profile_id IN (
        SELECT id FROM public.profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "allow_update_dashboard"
ON public.dashboards
FOR UPDATE
TO authenticated
USING (
    profile_id IN (
        SELECT id FROM public.profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "allow_delete_dashboard"
ON public.dashboards
FOR DELETE
TO authenticated
USING (
    profile_id IN (
        SELECT id FROM public.profiles 
        WHERE user_id = auth.uid()
    )
);

-- Create index to improve performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_profile_id ON public.dashboards(profile_id);