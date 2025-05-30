-- First, ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- 1. Public access policy for authentication
CREATE POLICY "public_auth_access"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- 2. Select Policy: Allow users to read their own profile and admins to read all profiles
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

-- 3. Insert Policy: Allow new users to create their profile during registration
CREATE POLICY "profiles_insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    -- Users can only insert their own profile
    user_id = auth.uid()
);

-- 4. Update Policy: Allow users to update their own profile, admins can update any profile
CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    -- Users can update their own profile
    user_id = auth.uid()
    OR
    -- Admins can update any profile
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- 5. Delete Policy: Allow users to delete their own profile, admins can delete any profile
CREATE POLICY "profiles_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (
    -- Users can delete their own profile
    user_id = auth.uid()
    OR
    -- Admins can delete any profile
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Create a test user for verification
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Create test user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_current,
        email_change_confirm_status,
        confirmed_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'test@webempire.io',
        crypt('testUser123', gen_salt('bf', 10)),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Test User"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        0,
        now()
    )
    RETURNING id INTO test_user_id;

    -- Create test user profile
    INSERT INTO public.profiles (
        user_id,
        role,
        confirmation
    )
    VALUES (
        test_user_id,
        'user',
        1
    );
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;

-- Create helper functions
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

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role
        FROM public.profiles
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;