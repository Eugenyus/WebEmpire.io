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
        reauthentication_sent_at,
        confirmed_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@webempire.io',
        crypt('testEmpire123', gen_salt('bf')),
        now(),
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        now(),
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
        NULL,
        now()  -- Set confirmed_at to ensure the account is confirmed
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

    -- Grant necessary permissions
    GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
    GRANT ALL ON auth.users TO postgres, anon, authenticated, service_role;
    GRANT ALL ON auth.refresh_tokens TO postgres, anon, authenticated, service_role;
END $$;