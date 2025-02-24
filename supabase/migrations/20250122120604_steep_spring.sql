-- First, ensure the admin user exists with proper credentials
DO $$
DECLARE
    admin_id uuid;
BEGIN
    -- Delete existing admin user if exists
    DELETE FROM auth.users WHERE email = 'admin@webempire.io';
    
    -- Create admin user with proper password hash
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change_token_current,
        email_change_confirm_status
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@webempire.io',
        crypt('admin123', gen_salt('bf')), -- Using a simpler password for testing
        now(),
        now(),
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