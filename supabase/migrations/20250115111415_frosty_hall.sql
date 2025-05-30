/*
  # Add Insert Policy for Profiles Table
  
  1. Changes
    - Add insert policy for profiles table to allow users to create their own profile
*/

-- Add insert policy for profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile"
          ON public.profiles
          FOR INSERT
          TO authenticated
          WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;