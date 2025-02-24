/*
  # Add admin access to auth.users

  1. Changes
    - Add policy to allow admin users to read auth.users data
    - Add foreign key relationship between profiles.user_id and auth.users.id
  
  2. Security
    - Only admin users can read auth.users data
    - Regular users cannot access auth.users data
*/

-- Create policy to allow admin users to read auth.users data
CREATE POLICY "Allow admin read access to auth.users"
ON auth.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add foreign key relationship if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_user_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;