/*
  # Auth Users Policies

  1. Changes
    - Create policies for auth.users table to allow admin access
    - Ensure proper access control for user data
  
  2. Security
    - Only admin users can access auth.users data
    - Policies are scoped to SELECT operations only
    - Access is restricted through profile role checks
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admin read access to auth.users" ON auth.users;
DROP POLICY IF EXISTS "Allow admin read user metadata" ON auth.users;

-- Create policy for basic user data access
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

-- Create policy for user metadata access
CREATE POLICY "Allow admin read user metadata"
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

-- Grant necessary permissions to authenticated users
GRANT SELECT ON auth.users TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE auth.users FORCE ROW LEVEL SECURITY;