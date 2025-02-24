-- Update password for bob@webempire.io
DO $$ 
BEGIN
    -- Update the password in auth.users table
    UPDATE auth.users
    SET encrypted_password = crypt('Xgy15Wq5', gen_salt('bf'))
    WHERE email = 'bob@webempire.io';

    -- Log the password update
    INSERT INTO public.debug_logs (
        operation,
        details
    ) VALUES (
        'password_update',
        jsonb_build_object(
            'email', 'bob@webempire.io',
            'timestamp', now()
        )
    );
END $$;