-- First, clean up any existing admin user
DO $$
BEGIN
    -- Delete existing admin user if exists
    DELETE FROM auth.users WHERE email = 'admin@webempire.io';
    DELETE FROM public.profiles WHERE role = 'admin';
END $$;

-- Create the admin user using Supabase's auth.users table
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_current,
    email_change_confirm_status,
    is_super_admin
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@webempire.io',
    '{"full_name": "Admin User"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    -- Use the correct password hashing format that Supabase expects
    '$2a$10$' || encode(sha256(('testEmpire123' || gen_random_uuid()::text)::bytea), 'hex'),
    now(),
    now(),
    now(),
    '',
    '',
    '',
    0,
    false
);

-- Create the admin profile
INSERT INTO public.profiles (
    user_id,
    role,
    confirmation
)
SELECT 
    id,
    'admin',
    1
FROM auth.users 
WHERE email = 'admin@webempire.io';

-- Ensure proper permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Create auth_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.auth_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text,
    success boolean,
    error_message text,
    attempt_time timestamptz DEFAULT now()
);

-- Create logging function
CREATE OR REPLACE FUNCTION auth.log_auth_attempt()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.auth_logs (
        email,
        success,
        error_message,
        attempt_time
    )
    VALUES (
        NEW.email,
        CASE 
            WHEN NEW.last_sign_in_at IS NOT NULL THEN true
            ELSE false
        END,
        CASE 
            WHEN NEW.last_sign_in_at IS NULL THEN 'Failed login attempt'
            ELSE 'Successful login'
        END,
        now()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS log_auth_attempt ON auth.users;
CREATE TRIGGER log_auth_attempt
    AFTER UPDATE OF last_sign_in_at
    ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.log_auth_attempt();

-- Grant access to the logs table
GRANT SELECT ON public.auth_logs TO authenticated;

-- Update RLS policies to ensure proper access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies with proper checks
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

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