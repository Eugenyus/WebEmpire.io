-- First, ensure we have the proper extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing admin user
DO $$
BEGIN
    DELETE FROM auth.users WHERE email = 'admin@webempire.io';
    DELETE FROM public.profiles WHERE role = 'admin';
END $$;

-- Create admin user with proper password hashing
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
    'admin@webempire.io',
    -- This is the key fix - use the correct password hashing format
    crypt('testEmpire123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Admin User"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    0,
    now()
)
RETURNING id INTO admin_id;

-- Create admin profile
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

-- Create test user with proper password hashing
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
    -- Use the same correct password hashing format
    crypt('testUser123', gen_salt('bf')),
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
SELECT 
    id,
    'user',
    1
FROM auth.users 
WHERE email = 'test@webempire.io';