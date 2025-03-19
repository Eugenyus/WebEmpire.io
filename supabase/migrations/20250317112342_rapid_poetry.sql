-- Drop existing function
DROP FUNCTION IF EXISTS delete_user(uuid);

-- Create function with proper permissions
CREATE OR REPLACE FUNCTION delete_user(p_user_id UUID)
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
    WHERE user_id = p_user_id;

    -- Delete the user from auth.users (this will cascade to profiles)
    DELETE FROM auth.users WHERE id = p_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the actual error
        RAISE LOG 'Error in delete_user: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_user(UUID) TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT DELETE ON auth.users TO authenticated;

-- Ensure RLS is enabled on auth.users
ALTER TABLE auth.users FORCE ROW LEVEL SECURITY;

-- Create policy to allow admin deletion
CREATE POLICY "Allow admin to delete users"
    ON auth.users
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );