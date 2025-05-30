-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_insert" ON public.profiles;

-- Create new non-recursive policies
CREATE POLICY "admin_full_access"
ON public.profiles
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.id IN (
            SELECT user_id 
            FROM public.profiles 
            WHERE role = 'admin'
        )
    )
);

CREATE POLICY "users_read_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR 
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.id IN (
            SELECT user_id 
            FROM public.profiles 
            WHERE role = 'admin'
        )
    )
);

CREATE POLICY "users_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;