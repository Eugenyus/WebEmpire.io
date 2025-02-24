-- First, ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- 1. Select Policy: Allow users to read their own profile and admins to read all profiles
CREATE POLICY "profiles_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    -- Users can read their own profile
    user_id = auth.uid()
    OR
    -- Admins can read all profiles
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- 2. Insert Policy: Allow users to create their own profile
CREATE POLICY "profiles_insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    -- Users can only insert their own profile
    user_id = auth.uid()
);

-- 3. Update Policy: Allow users to update their own profile
CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    -- Users can only update their own profile
    user_id = auth.uid()
);

-- 4. Delete Policy: Allow users to delete their own profile
CREATE POLICY "profiles_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (
    -- Users can only delete their own profile
    user_id = auth.uid()
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;