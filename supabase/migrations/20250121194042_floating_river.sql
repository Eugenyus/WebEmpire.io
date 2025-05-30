-- First, remove the existing admin user if it exists
DELETE FROM auth.users WHERE email = 'admin@webempire.io';
DELETE FROM public.profiles WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'admin@webempire.io'
);

-- Create admin user with proper password hashing
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@webempire.io',
    crypt('testEmpire123', gen_salt('bf', 10)),
    now(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin User"}',
    FALSE,
    now(),
    now(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
) RETURNING id;

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