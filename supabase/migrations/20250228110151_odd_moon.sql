-- Create a function to update user email and phone in both tables
CREATE OR REPLACE FUNCTION public.update_user_info(
  user_id UUID,
  new_email TEXT DEFAULT NULL,
  new_phone TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  profile_id UUID;
  current_email TEXT;
  current_phone TEXT;
BEGIN
  -- Get the current email and phone from auth.users
  SELECT email, phone INTO current_email, current_phone
  FROM auth.users
  WHERE id = user_id;
  
  -- Get the profile ID
  SELECT id INTO profile_id
  FROM public.profiles
  WHERE user_id = user_id;
  
  -- If user not found, return false
  IF profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update email if provided and different from current
  IF new_email IS NOT NULL AND new_email != current_email THEN
    -- Update in auth.users
    UPDATE auth.users
    SET email = new_email
    WHERE id = user_id;
    
    -- Update in public.profiles
    UPDATE public.profiles
    SET email = new_email
    WHERE id = profile_id;
  END IF;
  
  -- Update phone if provided and different from current
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
GRANT EXECUTE ON FUNCTION public.update_user_info TO authenticated;

-- Create a function to update user phone only (since email updates might require verification)
CREATE OR REPLACE FUNCTION public.update_user_phone(
  user_id UUID,
  new_phone TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.update_user_info(user_id, NULL, new_phone);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_phone TO authenticated;