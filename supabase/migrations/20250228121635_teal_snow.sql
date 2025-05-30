-- Drop the existing update_user_phone function if it exists
DROP FUNCTION IF EXISTS public.update_user_phone(uuid, text);

-- Create a fixed version of the update_user_phone function
CREATE OR REPLACE FUNCTION public.update_user_phone(
  user_id UUID,
  new_phone TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  profile_id UUID;
  current_phone TEXT;
BEGIN
  -- Get the current phone from auth.users
  SELECT phone INTO current_phone
  FROM auth.users
  WHERE id = user_id;
  
  -- Get the profile ID
  SELECT id INTO profile_id
  FROM public.profiles
  WHERE user_id = user_id;
  
  -- If profile not found, return false
  IF profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update phone if different from current
  IF new_phone IS NOT NULL AND new_phone != current_phone THEN
    -- Update in auth.users
    UPDATE auth.users
    SET phone = new_phone
    WHERE id = user_id;
    
    -- Update in public.profiles
    UPDATE public.profiles
    SET phone = new_phone
    WHERE id = profile_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_phone TO authenticated;