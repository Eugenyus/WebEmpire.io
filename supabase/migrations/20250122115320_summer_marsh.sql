-- First disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing foreign key if it exists
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Add the foreign key constraint with CASCADE delete
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT SELECT ON auth.users TO postgres, anon, authenticated, service_role;

-- Enable RLS on auth.users
ALTER TABLE auth.users FORCE ROW LEVEL SECURITY;

-- Create policies for auth.users
DROP POLICY IF EXISTS "Allow admin read access to auth.users" ON auth.users;
CREATE POLICY "Allow admin read access to auth.users"
ON auth.users
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Create policy for public profiles access
DROP POLICY IF EXISTS "Allow authenticated access to profiles" ON public.profiles;
CREATE POLICY "Allow authenticated access to profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    -- Allow admins to see all profiles
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
    OR
    -- Allow users to see their own profile
    user_id = auth.uid()
);