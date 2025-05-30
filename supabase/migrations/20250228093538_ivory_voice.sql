-- Create a function to update a user's password directly
CREATE OR REPLACE FUNCTION update_user_password(
  user_id UUID,
  new_password TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_password TO authenticated;