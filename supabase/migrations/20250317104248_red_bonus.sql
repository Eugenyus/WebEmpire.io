-- Create a function to safely delete users
CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
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
  DELETE FROM auth.users WHERE id = user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user TO authenticated;