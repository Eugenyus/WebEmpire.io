-- First drop the existing foreign key constraint
ALTER TABLE public.dashboards
DROP CONSTRAINT IF EXISTS dashboards_profile_id_fkey;

-- Recreate the constraint with ON DELETE CASCADE
ALTER TABLE public.dashboards
ADD CONSTRAINT dashboards_profile_id_fkey
FOREIGN KEY (profile_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Update the delete_user function to handle the deletion in the correct order
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

    -- Delete from profiles first (will cascade to dashboards)
    DELETE FROM public.profiles WHERE user_id = p_user_id;
    
    -- Then delete from auth.users
    DELETE FROM auth.users WHERE id = p_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in delete_user: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;