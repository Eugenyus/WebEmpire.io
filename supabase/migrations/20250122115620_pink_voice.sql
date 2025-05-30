-- First disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create new non-recursive policies
CREATE POLICY "profiles_admin_all"
ON public.profiles
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p2
        WHERE p2.user_id = auth.uid()
        AND p2.role = 'admin'
    )
);

CREATE POLICY "profiles_user_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

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