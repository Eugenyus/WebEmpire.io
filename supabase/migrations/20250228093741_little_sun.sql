-- Create a more secure function to update user password with proper permissions
CREATE OR REPLACE FUNCTION public.reset_user_password(
  reset_token TEXT,
  new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  profile_id UUID;
BEGIN
  -- Find the profile with this token
  SELECT p.user_id, p.id INTO target_user_id, profile_id
  FROM public.profiles p
  WHERE p.recovery_token = reset_token
  AND p.recovery_sent_at > (now() - interval '24 hours');
  
  -- If no valid token found, return false
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the password
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = target_user_id;
  
  -- Clear the reset token
  UPDATE public.profiles
  SET recovery_token = NULL,
      recovery_sent_at = NULL
  WHERE id = profile_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.reset_user_password TO authenticated, anon;

-- Create policy to allow anonymous users to find profiles by recovery token
DROP POLICY IF EXISTS "allow_anon_reset_token_access" ON public.profiles;
CREATE POLICY "allow_anon_reset_token_access"
ON public.profiles
FOR SELECT
TO anon
USING (recovery_token IS NOT NULL);

-- Create policy to allow anonymous users to update profiles with recovery tokens
DROP POLICY IF EXISTS "allow_anon_reset_password" ON public.profiles;
CREATE POLICY "allow_anon_reset_password"
ON public.profiles
FOR UPDATE
TO anon
USING (recovery_token IS NOT NULL)
WITH CHECK (recovery_token IS NOT NULL);