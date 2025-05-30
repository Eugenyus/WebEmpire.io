-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_insert" ON public.profiles;

-- Create new simplified policies
CREATE POLICY "profiles_admin_all"
ON public.profiles
FOR ALL
TO authenticated
USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

CREATE POLICY "profiles_user_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

CREATE POLICY "profiles_user_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_user_insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;