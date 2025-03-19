-- Drop existing function if it exists
DROP FUNCTION IF EXISTS delete_user(uuid);

-- Create a function to safely delete users with proper permissions
CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    target_role text;
BEGIN
    -- Check if the executing user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admin users can delete users';
    END IF;

    -- Get the role of the user being deleted
    SELECT role INTO target_role
    FROM public.profiles
    WHERE user_id = user_id;

    -- Prevent deleting the last admin user
    IF target_role = 'admin' THEN
        IF (
            SELECT COUNT(*)
            FROM public.profiles
            WHERE role = 'admin'
        ) <= 1 THEN
            RAISE EXCEPTION 'Cannot delete the last admin user';
        END IF;
    END IF;

    -- Delete the user from auth.users (this will cascade to profiles)
    DELETE FROM auth.users WHERE id = user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting user: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user TO authenticated;