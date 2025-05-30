-- First, ensure proper permissions for user registration
DO $$ 
BEGIN
    -- Grant necessary permissions to the anon role
    GRANT USAGE ON SCHEMA auth TO anon;
    GRANT SELECT ON auth.users TO anon;
    
    -- Grant necessary permissions to both anon and authenticated roles
    GRANT USAGE ON SCHEMA public TO anon, authenticated;
    GRANT ALL ON public.profiles TO anon, authenticated;
END $$;

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "public_auth_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- 1. Public access policy for authentication and registration
CREATE POLICY "public_auth_access"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- 2. Allow new users to insert their profile during registration
CREATE POLICY "allow_registration"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (
    -- New users can only create their own profile
    auth.uid() = user_id
    AND
    -- Ensure role is 'user' for new registrations
    role = 'user'
);

-- 3. Allow authenticated users to read profiles
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

-- 4. Allow users to update their own profile
CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
    -- Users can only update their own profile
    user_id = auth.uid()
    AND
    -- Cannot change role through update
    (
        CASE
            WHEN role IS NOT DISTINCT FROM OLD.role THEN true
            ELSE EXISTS (
                SELECT 1 FROM public.profiles
                WHERE user_id = auth.uid()
                AND role = 'admin'
            )
        END
    )
);

-- Create or replace trigger to set default values
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.role := COALESCE(NEW.role, 'user');
    NEW.confirmation := COALESCE(NEW.confirmation, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS handle_new_user ON public.profiles;
CREATE TRIGGER handle_new_user
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();