/*
  # Add role column to profiles table

  1. Changes
    - Add 'role' column to profiles table with default value 'user'
    - Add check constraint to ensure role is either 'user' or 'admin'
    - Update existing users to have 'user' role
*/

-- Add role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN role text DEFAULT 'user' NOT NULL;

        -- Add check constraint to ensure valid roles
        ALTER TABLE public.profiles
        ADD CONSTRAINT valid_role CHECK (role IN ('user', 'admin'));

        -- Update existing records to have 'user' role
        UPDATE public.profiles
        SET role = 'user'
        WHERE role IS NULL;
    END IF;
END $$;