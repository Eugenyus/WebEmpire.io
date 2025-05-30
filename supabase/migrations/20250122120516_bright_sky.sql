-- First, disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies and functions
DROP POLICY IF EXISTS "allow_admin_full_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
DROP FUNCTION IF EXISTS auth.is_admin();

-- Create new simplified policies
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can read their own profile
  user_id = auth.uid()
  OR
  -- Users with admin role can read all profiles
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
    AND p.id != profiles.id  -- Prevent recursion
  )
);

CREATE POLICY "profiles_insert_policy"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_delete_policy"
ON public.profiles
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;