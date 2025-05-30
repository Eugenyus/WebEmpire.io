-- First, ensure we have the proper extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Recreate admin user with proper credentials
DO $$
DECLARE
    admin_id uuid;
BEGIN
    -- Delete existing admin user if exists
    DELETE FROM auth.users WHERE email = 'admin@webempire.io';
    DELETE FROM public.profiles WHERE role = 'admin';
    
    -- Create admin user with proper password hash
    INSERT INTO auth.users (
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
        email_change_token_current,
        email_change_confirm_status
    )
    VALUES (
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@webempire.io',
        crypt('admin123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Admin User"}',
        now(),
        now(),
        '',
        '',
        0
    )
    RETURNING id INTO admin_id;

    -- Create admin profile
    INSERT INTO public.profiles (
        user_id,
        role,
        confirmation
    )
    VALUES (
        admin_id,
        'admin',
        1
    );

    -- Refresh admin roles view
    REFRESH MATERIALIZED VIEW admin_roles;
END $$;