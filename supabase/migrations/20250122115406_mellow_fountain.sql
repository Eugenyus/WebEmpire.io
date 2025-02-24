-- First disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new non-recursive policies
CREATE POLICY "Allow admin full access"
ON public.profiles
FOR ALL
TO authenticated
USING (
    role = 'admin'
    AND user_id = auth.uid()
);

CREATE POLICY "Allow users to read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);

CREATE POLICY "Allow users to update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;