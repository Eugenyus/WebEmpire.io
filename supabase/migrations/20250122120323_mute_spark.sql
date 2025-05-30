-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "admin_full_access" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own" ON public.profiles;

-- Create new simplified policies
CREATE POLICY "allow_read"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "allow_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;