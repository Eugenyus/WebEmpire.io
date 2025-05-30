-- First, disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "allow_read" ON public.profiles;
DROP POLICY IF EXISTS "allow_update_own" ON public.profiles;
DROP POLICY IF EXISTS "allow_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "admin_full_access" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_insert" ON public.profiles;

-- Create new simplified policies without recursion
CREATE POLICY "profiles_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "profiles_insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;