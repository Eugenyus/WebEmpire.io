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
    email_change_confirm_status
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@webempire.io',
    '{"full_name": "Admin User"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    -- Use Supabase's password hashing function
    crypt('testEmpire123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '',
    '',
    0;

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