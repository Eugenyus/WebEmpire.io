/*
  # Add delete_user function

  1. Changes
    - Create delete_user function to safely delete users
    - Add proper security checks and error handling
    - Grant necessary permissions

  2. Security
    - Function runs with SECURITY DEFINER
    - Only admin users can execute the function
    - Proper error handling and validation
*/

-- Create function to safely delete users
CREATE OR REPLACE FUNCTION public.delete_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the executing user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admin users can delete users';
    END IF;

    -- Delete the user from auth.users (this will cascade to profiles)
    DELETE FROM auth.users WHERE id = p_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in delete_user: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT DELETE ON auth.users TO authenticated;

-- Ensure RLS is enabled on auth.users
ALTER TABLE auth.users FORCE ROW LEVEL SECURITY;

-- Create policy to allow admin deletion
DROP POLICY IF EXISTS "Allow admin to delete users" ON auth.users;
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